// ReadNow Core Library
// 여러 Tampermonkey 스크립트(중고가 검토 도우미, 판매자 정보 툴팁, 앞으로 만들 판매가 자동 결정 시스템 등)가
// @require 로 함께 가져다 쓰는 공용 로직 모음입니다.
//
// 이 파일 자체는 독립 실행되는 유저스크립트가 아니라, 다른 스크립트의 @require 로만 사용됩니다.
// GM_xmlhttpRequest 등은 이 파일을 불러오는 스크립트의 @grant 설정을 그대로 사용합니다.
//
// 사용하는 쪽 스크립트에서는:
//   const Core = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).ReadNowCore;
// 로 꺼내 쓰면 됩니다.

(function (global) {
  'use strict';

  // =========================================================================
  // 공용 유틸
  // =========================================================================

  // 상품명 앞의 "[..]" 표기와 그 뒤 공백, " - " 이후의 부제목,
  // 그리고 맨 뒤의 마침표/느낌표/물음표 등 문장부호 제거
  function cleanTitle(title) {
    let t = (title || '').replace(/^\[[^\]]*\]\s*/, '').trim();
    const idx = t.indexOf(' - ');
    if (idx !== -1) t = t.slice(0, idx).trim();
    t = t.replace(/[.!?…,;:]+$/, '').trim();
    return t;
  }

  function cleanHtmlText(html) {
    return (html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  // 단어(숫자 포함) 단위를 유지하면서 대략 maxLen자 근처에서 줄바꿈
  function chunkText(text, maxLen) {
    const words = (text || '').split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? current + ' ' + word : word;
      if (candidate.length > maxLen && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines.join('<br>');
  }

  // =========================================================================
  // 상품 검색/매칭 로직 (TTB가 못 찾는 DVD/음반 등도 대응)
  // "지금 보고 있는 상품"과 "알라딘 검색 결과의 여러 후보" 중 진짜 같은 상품을 찾아냄.
  // 판매가 자동 결정 시스템의 1단계(유효한 상품 후보군 추리기)로 그대로 재사용될 로직.
  // =========================================================================

  // 우리 상품(알라딘 새책 상품페이지 기준)의 출시일/저자/출판사 조회
  function fetchOwnProductMeta(itemId, cb) {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`,
      timeout: 15000,
      ontimeout: () => cb({ date: null, authors: [], publisher: '' }),
      onload: (res) => {
        const html = res.responseText;
        const dateMatch = html.match(/<span class="Ere_PR10"><\/span>(\d{4}-\d{2}-\d{2})<span class="Ere_PR10">/);
        const liMatch = html.match(/<li class="Ere_sub2_title">([\s\S]*?)<\/li>/);
        let authors = [];
        let publisher = '';
        if (liMatch) {
          authors = [...liMatch[1].matchAll(/AuthorSearch=[^"]*"[^>]*>([^<]+)<\/a>/g)].map((a) => a[1]);
          const pubMatch = liMatch[1].match(/PublisherSearch=[^"]*"[^>]*>([^<]+)<\/a>/);
          publisher = pubMatch ? pubMatch[1] : '';
        }
        cb({ date: dateMatch ? dateMatch[1] : null, authors, publisher });
      },
      onerror: () => cb({ date: null, authors: [], publisher: '' }),
    });
  }

  // 검색 결과에서 후보별로 {itemId, title, year, month, authors, publisher, hasNewBookPrice} 추출
  function parseSearchCandidatesDetailed(html) {
    const titleRe = /<a href="\/shop\/UsedShop\/wuseditemall\.aspx\?ItemId=(\d+)" class="bo3"><b>([^<]+)<\/b><\/a>/g;
    const marks = [];
    let m;
    while ((m = titleRe.exec(html)) !== null) {
      marks.push({ index: m.index, itemId: m[1], title: m[2].trim() });
    }
    const candidates = [];
    for (let i = 0; i < marks.length; i++) {
      const start = marks[i].index;
      const end = i + 1 < marks.length ? marks[i + 1].index : html.length;
      const block = html.slice(start, end);

      const dateMatch = block.match(/(\d{4})년\s*(\d{1,2})월/);
      const authors = [...block.matchAll(/AuthorSearch=[^"]*"[^>]*>([^<]+)<\/a>/g)].map((a) => a[1]);
      const publisherMatch = block.match(/PublisherSearch=[^"]*"[^>]*>([^<]+)<\/a>/);
      const newBookRe = new RegExp(
        `wproduct\\.aspx\\?ItemId=${marks[i].itemId}"\\s+class="bo_used"><b>([\\d,]+원[^<]*)<\\/b><\\/a>`
      );
      const newBookMatch = block.match(newBookRe);

      candidates.push({
        itemId: marks[i].itemId,
        title: marks[i].title,
        year: dateMatch ? parseInt(dateMatch[1], 10) : null,
        month: dateMatch ? parseInt(dateMatch[2], 10) : null,
        authors,
        publisher: publisherMatch ? publisherMatch[1] : '',
        hasNewBookPrice: !!newBookMatch,
      });
    }
    return candidates;
  }

  function searchUsedCandidatesDetailed(keyword, cb) {
    const kw = encodeURIComponent(keyword);
    const url =
      `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Used` +
      `&KeyWord=${kw}&OutStock=0&ViewType=Detail&KeyFullWord=${kw}&KeyLastWord=${kw}`;
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      timeout: 15000,
      ontimeout: () => cb([]),
      onload: (res) => cb(parseSearchCandidatesDetailed(res.responseText)),
      onerror: () => cb([]),
    });
  }

  // 동점 처리 순서: 출시년월(개월차) -> 출판사 일치 -> 저자 겹침 개수. 그래도 남으면 첫 번째
  function pickBestCandidate(candidates, ourMeta) {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    let pool = candidates;

    if (ourMeta && ourMeta.date) {
      const ourDate = new Date(ourMeta.date);
      const oy = ourDate.getFullYear();
      const om = ourDate.getMonth() + 1;
      const withDate = candidates.filter((c) => c.year != null && c.month != null);
      if (withDate.length > 0) {
        let minDiff = Infinity;
        withDate.forEach((c) => {
          const diff = Math.abs((c.year - oy) * 12 + (c.month - om));
          if (diff < minDiff) minDiff = diff;
        });
        pool = withDate.filter((c) => Math.abs((c.year - oy) * 12 + (c.month - om)) === minDiff);
      }
    }
    if (pool.length === 1) return pool[0];

    if (ourMeta && ourMeta.publisher) {
      const pubMatches = pool.filter((c) => c.publisher && c.publisher === ourMeta.publisher);
      if (pubMatches.length > 0) pool = pubMatches;
    }
    if (pool.length === 1) return pool[0];

    if (ourMeta && ourMeta.authors && ourMeta.authors.length > 0) {
      const overlapCount = (c) => (c.authors || []).filter((a) => ourMeta.authors.includes(a)).length;
      const maxOverlap = Math.max(...pool.map(overlapCount));
      const withMaxOverlap = pool.filter((c) => overlapCount(c) === maxOverlap);
      if (withMaxOverlap.length > 0) pool = withMaxOverlap;
    }

    return pool[0];
  }

  // 상품명 검색: 제목이 정확히 일치 + "새책" 가격 근거가 있는 후보만 자동 선택 대상으로 삼음.
  // noAutoMatch: true 를 반환하면 자동으로 고르지 않고 검색결과 페이지에 그대로 머무르는 게 맞음
  function resolveViaTitleSearchWithNewBookCheck(title, ourMeta, cb) {
    const cleanedTitle = cleanTitle(title);
    searchUsedCandidatesDetailed(cleanedTitle, (candidates) => {
      if (candidates.length === 0) {
        cb(null);
        return;
      }
      const exactTitleMatches = candidates.filter((c) => c.title === cleanedTitle);
      const withNewBook = exactTitleMatches.filter((c) => c.hasNewBookPrice);

      if (withNewBook.length === 0) {
        cb({ noAutoMatch: true });
        return;
      }
      cb(pickBestCandidate(withNewBook, ourMeta));
    });
  }

  // ISBN 검색 -> 없으면 상품명(새책 근거 확인 포함) 검색 -> 그래도 없으면 null
  function resolveUsedItemIdViaSearch(isbn13, title, updateItemId, cb) {
    fetchOwnProductMeta(updateItemId, (ourMeta) => {
      searchUsedCandidatesDetailed(isbn13, (candidatesByIsbn) => {
        if (candidatesByIsbn.length > 0) {
          cb(pickBestCandidate(candidatesByIsbn, ourMeta));
          return;
        }
        resolveViaTitleSearchWithNewBookCheck(title, ourMeta, cb);
      });
    });
  }

  // =========================================================================
  // 판매자 등급 판정 (순수 계산 로직만 — DOM/화면 표시는 각 스크립트 쪽에서 담당)
  // 판매가 자동 결정 시스템에서 "유효한 판매자"를 걸러내는 기준으로 그대로 재사용됨.
  // =========================================================================

  // 사업년차 계산 (최초 리뷰일 기준)
  function computeBusinessYears(firstReviewDate) {
    if (!firstReviewDate) return null;
    const first = new Date(firstReviewDate);
    if (isNaN(first.getTime())) return null;
    const years = (Date.now() - first.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
  }

  // 배경색: 오직 평가수 기준 (5단계, 평가 없는 것도 빨강에 포함)
  // 폰트색: 품절취소율/총상품수/배송비/평점 기준 (배경과 무관, 진한 색 + 볼드)
  function evaluateBackground(info, rowShippingFee) {
    const reviewCountNum = parseInt((info.reviewCount || '').replace(/,/g, ''), 10);
    const outstockNum = parseFloat(info.outstockRate);
    const totalItemsNum = parseInt((info.totalItems || '').replace(/,/g, ''), 10);
    const ratingNum = parseFloat(info.rating);

    let bg, bgReason;
    if (isNaN(reviewCountNum) || reviewCountNum < 50) {
      bg = '#ffd6d6';
      bgReason = isNaN(reviewCountNum) ? '평가 없음' : '평가수 50개 미만';
    } else if (reviewCountNum < 100) {
      bg = '#ffcc80';
      bgReason = '평가수 50~99개';
    } else if (reviewCountNum < 200) {
      bg = '#fff3b0';
      bgReason = '평가수 100~199개';
    } else if (reviewCountNum < 1000) {
      bg = '#c9f2c9';
      bgReason = '평가수 200개 이상';
    } else {
      bg = '#66c17a';
      bgReason = '평가수 1000개 이상';
    }

    const redReasons = [];
    const redKeys = [];
    if (!isNaN(outstockNum) && outstockNum >= 15) {
      redReasons.push('품절취소율 15% 이상');
      redKeys.push('outstock');
    }
    if (!isNaN(totalItemsNum) && totalItemsNum < 100) {
      redReasons.push('총상품수 100개 미만');
      redKeys.push('total');
    }
    if (!isNaN(rowShippingFee) && rowShippingFee >= 5000) {
      redReasons.push('배송비 5,000원 이상');
      redKeys.push('shipping');
    }
    if (!isNaN(ratingNum) && ratingNum < 90) {
      redReasons.push('평점 90% 미만');
      redKeys.push('rating');
    }
    if (redReasons.length > 0) {
      return { bg, bgReason, fontColor: '#a30000', fontReasons: redReasons, fontKeys: redKeys };
    }

    const orangeReasons = [];
    const orangeKeys = [];
    if (!isNaN(outstockNum) && outstockNum >= 10 && outstockNum < 15) {
      orangeReasons.push('품절취소율 10~14.99%');
      orangeKeys.push('outstock');
    }
    if (!isNaN(ratingNum) && ratingNum >= 90 && ratingNum < 94) {
      orangeReasons.push('평점 90~93.99%');
      orangeKeys.push('rating');
    }
    if (orangeReasons.length > 0) {
      return { bg, bgReason, fontColor: '#a15c00', fontReasons: orangeReasons, fontKeys: orangeKeys };
    }

    const yellowReasons = [];
    const yellowKeys = [];
    if (!isNaN(outstockNum) && outstockNum >= 5 && outstockNum < 10) {
      yellowReasons.push('품절취소율 5~9.99%');
      yellowKeys.push('outstock');
    }
    if (!isNaN(ratingNum) && ratingNum >= 94 && ratingNum < 97) {
      yellowReasons.push('평점 94~96.99%');
      yellowKeys.push('rating');
    }
    if (yellowReasons.length > 0) {
      return { bg, bgReason, fontColor: '#7a6900', fontReasons: yellowReasons, fontKeys: yellowKeys };
    }

    if (!isNaN(outstockNum) && outstockNum < 5 && !isNaN(ratingNum) && ratingNum >= 97) {
      return {
        bg,
        bgReason,
        fontColor: '#0d5c0d',
        fontReasons: ['품절취소율 5% 미만, 평점 97% 이상'],
        fontKeys: ['outstock', 'rating'],
      };
    }

    return { bg, bgReason, fontColor: null, fontReasons: [], fontKeys: [] };
  }

  // 음반/DVD 비중이 30% 이상인 판매자 판정. 강조색은 평가수 기준
  function evaluateAvHighlight(info) {
    const totalItemsNum = parseInt((info.totalItems || '').replace(/,/g, ''), 10);
    if (!totalItemsNum || isNaN(totalItemsNum)) return null;
    const musicNum = parseInt((info.musicCount || '').replace(/,/g, ''), 10);
    const videoNum = parseInt((info.videoCount || '').replace(/,/g, ''), 10);

    const musicPct = !isNaN(musicNum) ? (musicNum / totalItemsNum) * 100 : 0;
    const videoPct = !isNaN(videoNum) ? (videoNum / totalItemsNum) * 100 : 0;

    const labels = [];
    if (musicPct >= 30) labels.push(`음반(${musicPct.toFixed(0)}%)`);
    if (videoPct >= 30) labels.push(`DVD(${videoPct.toFixed(0)}%)`);
    if (labels.length === 0) return null;

    const reviewCountNum = parseInt((info.reviewCount || '').replace(/,/g, ''), 10);
    let bg, border;
    if (isNaN(reviewCountNum) || reviewCountNum < 30) {
      bg = '#ffeaea';
      border = '#c62828';
    } else if (reviewCountNum < 60) {
      bg = '#ffe9c7';
      border = '#ef6c00';
    } else if (reviewCountNum < 180) {
      bg = '#fffae0';
      border = '#c9a227';
    } else {
      bg = '#e3f9e3';
      border = '#2e7d32';
    }

    return { label: labels.join('/'), bg, border };
  }

  // =========================================================================
  // 내보내기
  // =========================================================================
  global.ReadNowCore = {
    // 유틸
    cleanTitle,
    cleanHtmlText,
    chunkText,
    // 상품 검색/매칭
    fetchOwnProductMeta,
    parseSearchCandidatesDetailed,
    searchUsedCandidatesDetailed,
    pickBestCandidate,
    resolveViaTitleSearchWithNewBookCheck,
    resolveUsedItemIdViaSearch,
    // 판매자 등급 판정
    computeBusinessYears,
    evaluateBackground,
    evaluateAvHighlight,
  };
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
