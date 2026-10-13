var gConsole = console;
/*=====*/

    var $j = jQuery.noConflict();
    var test = 0;
    
    $j(document).ready(function () {


        /// 1  ################################
        $j("#h_over_1").mouseover(function () {
            $j("#h_over_1_child").show();

        }).mouseout(function () {
            $j("#h_over_1_child").hide();
        });

        $j("#h_over_1_child").mouseover(function () {
            $j("#h_over_1_child").show();

        }).mouseout(function () {
            $j("#h_over_1_child").hide();
        });

        /// 2  ################################
        $j("#h_over_2").mouseover(function () {
            $j("#h_over_2_child").show();

        }).mouseout(function () {
            $j("#h_over_2_child").hide();
        });

        $j("#h_over_2_child").mouseover(function () {
            $j("#h_over_2_child").show();

        }).mouseout(function () {
            $j("#h_over_2_child").hide();
        });

        /// 3  ################################
        $j("#h_over_3").mouseover(function () {
            $j("#h_over_3_child").show();

        }).mouseout(function () {
            $j("#h_over_3_child").hide();
        });

        $j("#h_over_3_child").mouseover(function () {
            $j("#h_over_3_child").show();

        }).mouseout(function () {
            $j("#h_over_3_child").hide();
        });

    });


/*=====*/
 
        
        var _window = null;
        
        $j(document).ready(function () {
        
            if (_window == null)
                _window = $j(window);
        
            _window.bind('scroll.ScrollToTop', ScrollToTop_Scroll);
            
            $j('.btnScrollToTop').click(btnScrollToTop_Click);
        });
        
        function ScrollToTop_Scroll(e)
        {
            var btnScrollToTop = $j('.btnScrollToTop');
            
            if (btnScrollToTop.is(':visible') == true)
                return;
                
            btnScrollToTop.fadeIn(500);
        }
        
        function btnScrollToTop_Click(e)
        {
            $j('body, html').animate({scrollTop : 0}, 500, function() { $j('.btnScrollToTop').fadeOut(500); });
        }
        
    
/*=====*/

    function fn_pop_open(url, width, height) {
        window.open(url, "wc2b_gate_orderInfo", "width=" + width + ", height=" + height + ", scrollbars=no");
    }

/*=====*/

    //var mq = getModalQueue();
    //mq.push(100, "#c2c6MonthMainNoticeWrap", {
    //    autoResize: false, escClose: false,
    //    containerCss: { width: 745, height: 525 }
    //});

/*=====*/

    //<!--

    var g_isC2c = true;
    var g_usedItemType = 0;
    var g_branchType = 6;
    var g_searchitem_isbn = '';
	var g_IsValid_SearchItem = true;
    var g_HasC2C_SearchItem = false;

	window.onload = function () {
		document.querySelector("#tx_canvas_wysiwyg").contentDocument.body.addEventListener("click", function () {
			$j("#editor_placeholder").hide();
		});

        // 19금 처리
	    $j("#chkAgeAdultLevel").click(function(e){
	        if($j(this).attr("checked")){
	            $j('#noAgeLevel0').attr("checked",true);
	            $j("#ageLevel").val("1");
	        } else {
	            $j('#noAgeLevel1').attr("checked",true);
	            $j("#ageLevel").val("0");
	        }
	    });

        // 상품페이지에서 넘어온 ISBN이 있을때..일부항목 확정 & readOnly
       
        
        fn_formSet(1);
      

   }//onload

    addEvent2( "window", "onload", function(){ 
		$j(".priceUnitRadio").click(function(e){
			priceStdForeignValid($('priceStdForeign'));
		});

	    var autoIsbn = getEl('autoIsbn');
	    if( autoIsbn.checked )
			    checkAutoIsbn(autoIsbn);

	    //if(g_branchType==5) { isInPriceCalc_click(0); }	
    });
	
	function stockStatusChg()
	{   
	    //alert(getEl('stockState').value);
	    if(getEl('stockState').value == 8 || getEl('stockState').value == 9) 
	    {
	        if(getEl('stockState').value == 8) alert("1주일이내 입고 가능한 상품의 경우만 선택하세요.\n재입고 예정일을 입력해주세요.");	           
	        if(getEl('stockState').value == 9) alert("출고예정일을 입력해주세요.");
	        
	        getEl('dvStockDate').style.display = "";	    
	        getEl('inStockDate').focus();
	    }
	    else getEl('dvStockDate').style.display = "none";
	}
	function fn_addAuthor(trNo)
	{
	    getEl('tr'+trNo).style.display = "";
	}
	
	// 중고샵, 샵 타입별 element 달리 세팅.
	function fn_formSet(formFlag)
	{
        var trs = document.getElementsByTagName("tr");
        
        //bookSubTitle --> 이건 테이블인뎅...
        
        // 입력 컬럼 변경
        for (var i = 0 ; i < trs.length; i++) {
            if(trs[i].id.substring(0,4)=="book") 
            {
                if(formFlag==1 || formFlag==7){ getEl(trs[i].getAttribute("id")).style.display = "";}
                //if(formFlag==2 ) getEl(trs[i].getAttribute("id")).style.display = "none"; 
                //if(formFlag==3 ) getEl(trs[i].getAttribute("id")).style.display = "none";
            }
            if(trs[i].id.substring(0,5)=="music")
            {
                if(formFlag==1 || formFlag==7) getEl(trs[i].getAttribute("id")).style.display = "none";
                //if(formFlag==2 ) getEl(trs[i].getAttribute("id")).style.display = ""; 
                if(formFlag==3 ) getEl(trs[i].getAttribute("id")).style.display = "none";
            }
            if(trs[i].id.substring(0,7)=="foreign")
            {
                if(formFlag==7){getEl(trs[i].getAttribute("id")).style.display = "";
                }else{getEl(trs[i].getAttribute("id")).style.display = "none";}
            }
        }
		// 몰별 필드 변경
        if(formFlag==1) {
			$j("#univTr").show();
			$j("#univNoneTr").hide();
		} else {
			$j("#univTr").hide();
			$j("#univNoneTr").show();
		}

        if(formFlag==7) {
			$j("#priceUnitForeignTr").show();
			$j("#priceUnitWonTr").hide();
		} else {
			$j("#priceUnitForeignTr").hide();
			$j("#priceUnitWonTr").show();
		}

        // 네이밍 변경
        if(formFlag==1 || formFlag==7)
        {
            //getEl("bookSubTitle").style.display = "";
            getEl("bookSubTitle").style.display = "";
            getEl("usedAuthor1").innerHTML="지은이(저자)";
            getEl("usedAuthor2").innerHTML="옮긴이(역자)";            
            getEl("usedAuthor3").innerHTML="엮은이(편자)";
            getEl("usedAuthor4").innerHTML="그린이(그림)";
            getEl("usedAuthor5").innerHTML="감수자";
            getEl("bookPublisher").innerHTML="출판사";
            getEl("bookName").innerHTML="도서명";
            getEl("bookPubDate").innerHTML="출간일";
            // getEl("div_noPubDate").style.display="none";
            getEl("div_noPubDate").style.display="";
            getEl("bookPage").style.display="";
            getEl("bookPageTr").style.display="";
            getEl("bookSize").style.display="";
            getEl("bookSizeTr").style.display="";
            
            // 구매제한
            $('layerAgeLevel').style.display="none";
            // ISBN
            getEl("EXISBN").src = "//image.aladin.co.kr/img/scm/example-book.gif";
            //$('ISBNDESC1').innerHTML = "ISBN(바코드)";
            $('ISBNDESC2').innerHTML = "ISBN(바코드)를";
            $('ISBNDESC3').innerHTML = "ISBN(바코드)";
            $('ISBNDESC4').innerHTML = "ISBN(바코드)";
            $('ISBNDESC5').innerHTML = "상품명";
            
            if(formFlag==7){
				if(g_IsValid_SearchItem && g_searchitem_isbn!="") {
					$j("#usedAuthor2Tr").hide();
				} else {
					$j("#usedAuthor2Tr").show();
				}
                $j('#titleOriginTr, #titleOriginTr0, #priceUnitNoticeTr').hide(); // #priceUnitWonTr
            } else {
				if(g_IsValid_SearchItem && g_searchitem_isbn!="") {
					$j("#usedAuthor2Tr").hide();
				} else {
					$j("#usedAuthor2Tr").show();
				}
                $j('#titleOriginTr, #titleOriginTr0, #priceUnitNoticeTr').show();
            }

            if(g_HasC2C_SearchItem) {
                getEl("usedAuthor11").innerHTML="지은이(저자)";
                getEl("usedAuthor22").innerHTML="옮긴이(역자)";
                getEl("usedAuthor33").innerHTML="엮은이(편자)";
                getEl("usedAuthor44").innerHTML="그린이(그림)";
                getEl("usedAuthor55").innerHTML="감수자";
                getEl("usedAuthor66").innerHTML="출판사";
                getEl("usedAuthor77").innerHTML="출간일";
            }

            if(formFlag==1) {
                $j("#bookPubDateIcon").attr("src", "//image.aladin.co.kr/img/scm/icon_essential.gif")
            } else {
                $j("#bookPubDateIcon").attr("src", "//image.aladin.co.kr/img/scm/icon_choice.gif")
            }
        }
        if(formFlag==2)
        {   
            getEl("bookSubTitle").style.display = "none";
            getEl("usedAuthor1").innerHTML="노래";
            getEl("usedAuthor2").innerHTML="작곡";            
            getEl("usedAuthor3").innerHTML="작사";
            getEl("usedAuthor4").innerHTML="지휘";
            getEl("usedAuthor5").innerHTML="연주";
            getEl("bookPublisher").innerHTML="기획사";
            getEl("bookName").innerHTML="상품명";
            getEl("bookPubDate").innerHTML="출시일";
            getEl("div_noPubDate").style.display="";
            getEl("bookPage").style.display="none";
            getEl("bookPageTr").style.display="none";
            getEl("bookSize").style.display="none";
            getEl("bookSizeTr").style.display="none";
            
            // 구매제한
            $('layerAgeLevel').style.display="none";
            // ISBN
            getEl("EXISBN").src = "//image.aladin.co.kr/img/scm/example-music.gif";
            //$('ISBNDESC1').innerHTML = "바코드(음반번호)";
            $('ISBNDESC2').innerHTML = "바코드(또는 음반번호)를";
            $('ISBNDESC3').innerHTML = "바코드(음반번호)";
            $('ISBNDESC4').innerHTML = "바코드";
            $('ISBNDESC5').innerHTML = "상품명/음반번호";
            
            if(g_HasC2C_SearchItem) {
                getEl("usedAuthor11").innerHTML="노래";
                getEl("usedAuthor22").innerHTML="작곡";
                getEl("usedAuthor33").innerHTML="작사";
                getEl("usedAuthor44").innerHTML="지휘";
                getEl("usedAuthor55").innerHTML="연주";
                getEl("usedAuthor66").innerHTML="기획사";
                getEl("usedAuthor77").innerHTML="출시일";
            }

            $j("#bookPubDateIcon").attr("src", "//image.aladin.co.kr/img/scm/icon_choice.gif")
        }
        if(formFlag==3)
        {
            getEl("bookSubTitle").style.display = "none";
            getEl("usedAuthor1").innerHTML="출연";            
            getEl("usedAuthor2").innerHTML="감독";
            getEl("usedAuthor3").innerHTML="아티스트";
            getEl("usedAuthor4").innerHTML="연주";
            getEl("usedAuthor5").innerHTML="목소리";
            getEl("bookPublisher").innerHTML="기획사";
            getEl("bookName").innerHTML="상품명";
            getEl("bookPubDate").innerHTML="출시일";
            getEl("div_noPubDate").style.display="";
            getEl("bookPage").style.display="none";
            getEl("bookPageTr").style.display="none";
            getEl("bookSize").style.display="none";
            getEl("bookSizeTr").style.display="none";
            
            // 구매제한            
            
	            //$('layerAgeLevel').style.display="block";
		        getEl('noAgeLevel1').checked = false;
		        getEl('noAgeLevel0').checked = true;
		        getEl('ageLevel').value = "0";
		        getEl('noAgeLevel1').style.display="none";
		        getEl('labelnoAgeLevel').style.display="none";
	        
            // ISBN
            getEl("EXISBN").src = "//image.aladin.co.kr/img/scm/example-book.gif";
            //$('ISBNDESC1').innerHTML = "ISBN(바코드)";
            $('ISBNDESC2').innerHTML = "ISBN(바코드)를";
            $('ISBNDESC3').innerHTML = "ISBN(바코드)";
            $('ISBNDESC4').innerHTML = "ISBN(바코드)";
            $('ISBNDESC5').innerHTML = "상품명";
            
            if (g_HasC2C_SearchItem) {
                getEl("usedAuthor11").innerHTML="출연";
                getEl("usedAuthor22").innerHTML="감독";
                getEl("usedAuthor33").innerHTML="아티스트";
                getEl("usedAuthor44").innerHTML="연주";
                getEl("usedAuthor55").innerHTML="목소리";
                getEl("usedAuthor66").innerHTML="기획사";
                getEl("usedAuthor77").innerHTML="출시일";
            }   
            
            $j("#bookPubDateIcon").attr("src", "//image.aladin.co.kr/img/scm/icon_choice.gif")
        }
        
        if(g_branchType == 6) { // 시리즈도서등록,재고상태,출고소요시간 감추기
            ['bookSeries','bookSeriesTr','trdelivery'].each(function (tr) { $(tr).style.display="none"; });
            // 'trstocks','trOptSep1'

            if (g_HasC2C_SearchItem == false) { // isbn없이 접근
				c2cRecordPage.displayBottomNotice();
			}
        }
   	}
	
	function fn_SearchISBN()
	{   
	    var SearchISBNType = $('SearchISBNType').value;
	    getEl("sISBN").value = getEl("sISBN").value.trim();
	    //if(getEl("sISBN").value =="") { alert("ISBN을 입력해주세요."); getEl('sISBN').focus(); return false;}
	    var WarningFirst = $('SearchISBNType').options[$('SearchISBNType').selectedIndex].innerHTML;
	    WarningFirst = WarningFirst == "ISBN" || WarningFirst == "상품명" ? WarningFirst+"을" : WarningFirst+"를";
	    if(getEl("sISBN").value =="") { alert(WarningFirst+" 입력해주세요."); getEl('sISBN').focus(); return false;}
	    
        if (SearchISBNType == "ISBN") {
            if (getEl("sISBN").value.length < 10 || getEl("sISBN").value.length > 13) {
                alert("잘못된 ISBN 형식입니다.");
                getEl("sISBN").focus();
                return false;
            }
        }
	    var BranchType = SelectTypeValue();
	    	    	    
    	//window.open('/scm/wpopup_sISBN.aspx?ISBN='+getEl("sISBN").value+'&BranchType='+BranchType,'popup','width=422, height=590, scrollbars=1, resizable=0,status=1');
    	//alert('/scm/wpopup_sISBN.aspx?ISBN='+getEl("sISBN").value+'&SearchISBNType='+SearchISBNType+'&BranchType='+BranchType,'popup','width=422, height=590, scrollbars=1, resizable=0,status=1');        
        window.open('/scm/wpopup_sISBN.aspx?ISBN='+getEl("sISBN").value+'&SearchISBNType='+SearchISBNType+'&BranchType='+BranchType,'popup','width=422, height=590, scrollbars=1, resizable=0,status=1');
        //window.open('/scm/wpopup_sISBN.aspx?SearchISBNType='+SearchISBNType+'&BranchType='+BranchType,'popup','width=422, height=590, scrollbars=1, resizable=0,status=1');
	}
	
	function SelectTypeValue()
	{
	    var checkedSelectType = Form.getInputs('frmRecord','radio','SelectType').find(function(radio) { return radio.checked; });
	    if(!checkedSelectType){
	        return 1;
	    }
	    return checkedSelectType.value;
	}
	
	function popup_ItemSales()
	{
	    if(getEl("priceStd").value == "" || getEl("priceStd").value == "0") 
	    {
            alert("정가를 입력해주세요");
            getEl("priceStd").select();
        }
        else
        {
            var url = "/shop/UsedShop/wc2c_itemsales.aspx";
			var subBranchType = SelectTypeValue();
			var priceStdF = ''; // 외서 정가 정보

            
	        
	        var params = "?priceStd="+getEl("priceStd").value+"&ISBN="+$("isbn").value+"&BranchType="+subBranchType + priceStdF;

	                    
            if(getEl("priceSales").value.length>1 && getEl("priceSales").value!="") params=params+"&Update=true";            
            var w = window.open(url+params,'ItemSalesPopup','toolbar=no,scrollbars=yes,width=726,height=710');
        }
	}
	
	function popup_DeliveryPrice()
	{
	    var url = "wpopup_deliveryPrice.aspx";
	    window.open(url,'DeliveryPricePopup','toolbar=no,scrollbars=no,width=780,height=380');
	}
	
	function popup_ReturnAddress()
	{
	    var url = "wpopup_returnAddress.aspx";
	    window.open(url,'ReturnAddressPopup','toolbar=no,scrollbars=yes,width=780,height=280');
	}
	
	function caclPriceSalesFee () {
	    var priceSales = $('priceSales').value;

	    if(!priceSales || priceSales.length < 2){
	        return 0;
	    }

	    var priceSalesNum = parseInt(priceSales, 10);

	    if(isNaN(priceSalesNum)){
	        return 0;
	    }

	    return parseInt(priceSalesNum * 0.1, 10);
	}

	function calcSummaryC2C(){
	    var msg = "";
	    var fee = caclPriceSalesFee();

	    if(isNaN(fee) || fee<=0){
	        msg = "0";
	    } else {
	        msg = fee;
	    }
	    $("spanPriceSalesFee").innerHTML= msg;
	}

	function PercentPriceSales()
	{   
//	    var ps = $('priceSales').value;
//	    
//	    if(ps.length>3)
//	    { 
//	        
//	        var p = (parseInt(ps)/$('PriceStd').value*100);
//	        
//	        if(isNaN(p)==false) $('spanPriceSalesPerPriceStd').innerHTML= "<font color='gray'>정가 대비 " + Math.round(p) + "%가</font>";
//	    }
//	    else
//	    {
//	        $('spanPriceSalesPerPriceStd').innerHTML= "";
//	    }
	}
	
	function showFlashButtons()
	{
	    
	    Element.show($('submitFlash'));
	    $('submitButtons').style.visibility = "hidden";
	    
	}
	
	function seeMoreItemInput(){
	    var sotm = $('subOptionTableTbodyMore');
	    if(sotm.style.display!=''){
	        sotm.style.display = '';
	        $('seeMoreItemInputLink').innerHTML = '[감추기]';
	    } else {
	        sotm.style.display = 'none';
	        $('seeMoreItemInputLink').innerHTML = '[더보기]';
	    }
	}

    function selItemSize_Change(o){
        $('size').value = $j(o).find('option:selected').text();
        
        if(o.value==19){
            $j("#size")
                .removeAttr("readonly")
                .focus()
                .select();
        } else {
            $j("#size")
                .attr("readonly", "readonly");
        }
    }

	
	
	$j(document).ready(function() {
	
	    $j('#chkIsUniv').change(SetIsUniv);
	    
	    SetIsUniv();    
	
	});
	
	function SetIsUniv(e)
	{
	    var isUnivItem = $j('#chkIsUniv').attr('checked');
	    
        // 상품 타입 정렬
        var SelectType1 = $j('#SelectType1');
        var SelectType2 = $j('#SelectType2');
        var SelectType3 = $j('#SelectType3');
        var SelectType7 = $j('#SelectType7');
        
        if (isUnivItem == true)
        {
            // 국내도서 선택
            fn_formSet(1);
        
            SelectType1.attr('checked', 'checked');
            SelectType2.attr('disabled', 'disabled');
            SelectType3.attr('disabled', 'disabled');
            SelectType7.attr('disabled', 'disabled');
            
            $j('tr.trUnivInfo').show();
        }
        else
        {
            SelectType2.attr('disabled', '');
            SelectType3.attr('disabled', '');
            SelectType7.attr('disabled', '');
            $j('tr.trUnivInfo').hide();
        }
	}

	function priceStdForeignValid(o) {
		var priceUnitCode = $j(':radio[name=priceUnit]:checked').val();
		var res = true;

		if(priceUnitCode==4){
			if(onlyNumber(o)==false) { res = false; }
		} else {
			if(onlyFloat(o)==false) { res = false; }
		}

		if(res == false) {
			setTimeout(function(){ priceStdForeignValid(o); }, 200);
			return;  
		}

		var priceStdForeignFloat = parseFloat(o.value);
		var resultPriceStd = 0;

		if(isNaN(priceStdForeignFloat)==false) {
			var unitRateList = GetForeignExchangeRateList();
			var unitRate = unitRateList[priceUnitCode];
			resultPriceStd = parseInt(priceStdForeignFloat * unitRate/10) * 10;
		}

		$("priceStd").value = resultPriceStd;
		$("priceStdForeignResult").value = resultPriceStd;
	}

	function GetForeignExchangeRateList(){
		return [0,1360.00/*달러*/,1520.00/*유로*/,1790.00/*파운드*/,8.60/*엔화100*/,200.00/*위안화*/,1.00/*원*/];
	}
	
    function frmRecord_submit_C2C(isPreview, branchType, hasSearchitemIsbn){
        if(branchType == '6') {

        } 
        frmRecord_submit(isPreview, branchType, hasSearchitemIsbn);
    }
    function catPopUpCheck(branchType) {
        if (0 == 7637) {
            if (curCat == 1) {
                alert("앱에서는 카테고리 1개만 적용 가능합니다.");
                setClose();
                return;
            }
        }
        catPopUp(branchType);
    }
	//-->

/*=====*/


    function UnivCategory_Selected(categoryId, nav)
    {
        $j('#UnivCategoryId').val(categoryId);
        $j('#spanUnivCategoryNav').html(nav + ' ');
        $j('#btnFindUnivCategory').attr('src', '//image.aladin.co.kr/img/scm/modify_univ2.gif');
    }
    
    function FindUnivCategory_Show()
    {
        var url = '/scm/usedshop/popup/FindUnivCategory.aspx?selectedCID=' + $j('#UnivCategoryId').val();
    
        window.open(url,'FindUnivCategory', 'width=670, height=420, scrollbars=no').focus();
    }
    
    


/*=====*/


    //폰트추가 
    TrexMessage.addMsg({ '@fontfamily.malgungothic': '맑은 고딕' });
    TrexMessage.addMsg({ '@fontfamily.comicsansms': 'Comic Sans Ms' });
    TrexMessage.addMsg({ '@fontfamily.couriernew': 'Courier New' });
    TrexMessage.addMsg({ '@fontfamily.tahoma': 'Tahoma' });
    TrexMessage.addMsg({ '@fontfamily.timesnewroman': 'Times New Roman' });

    //http://code.google.com/p/daumopeneditor/issues/detail?id=503
    var font_malgungothic = ($tx.chrome) ? "'Malgun Gothic','맑은 고딕'" : 'Malgun Gothic,맑은 고딕';


// <![CDATA[
    var _frmname = 'frmRecord';
    if(_frmname ==''){
       _frmname = document.forms[0].name;
    }
    
   	new Editor({
		txHost: '', /* 런타임 시 리소스들을 로딩할 때 필요한 부분으로, 경로가 변경되면 이 부분 수정이 필요. ex) http://xxx.xxx.com */
		txPath: '/ucl/daumeditor/', /* 런타임 시 리소스들을 로딩할 때 필요한 부분으로, 경로가 변경되면 이 부분 수정이 필요. ex) /xxx/xxx/ */
		txVersion: '5.4.0', /* 수정필요없음. */
		txService: 'sample', /* 수정필요없음. */
		txProject: 'sample', /* 수정필요없음. 프로젝트가 여러개일 경우만 수정한다. */
		initializedId: "", /* 대부분의 경우에 빈문자열 */
		wrapper: "tx_trex_container"+"", /* 에디터를 둘러싸고 있는 레이어 이름(에디터 컨테이너) */
		form: _frmname +"", /* 등록하기 위한 Form 이름 */
		txIconPath: "//image.aladin.co.kr/img/editor/daum/icon/", /*에디터에 사용되는 이미지 디렉터리, 필요에 따라 수정한다. */
		txDecoPath: "//image.aladin.co.kr/img/editor/daum/deco/", /*본문에 사용되는 이미지 디렉터리, 서비스에서 사용할 때는 완성된 컨텐츠로 배포되기 위해 절대경로로 수정한다. */
		canvas: {
			styles: {
				color: "#000", /* 기본 글자색 */
				fontFamily: "돋움, 굴림, seoul, arial, verdana", /* 기본 글자체 */

                

                backgroundColor: "#fff", /*기본 배경색 */
				lineHeight: "1.5", /*기본 줄간격 */
				padding: "5px" /* 위지윅 영역의 여백 */
			},
			selectedMode : 'html'  /*모바일은 text모드*/
		},
		sidebar: {
			attacher: {
				attachbox: {
				    show: false
			    },
				image: {
				    features: { left: 0, top: 0, width: 520, height: 430 },
                    popPageUrl: "#host/scm/upload/wimage_upload_scm.aspx"
				}
			}
		},

		toolbar: {
		    fontfamily: {
		        options: [
				    { label: TXMSG('@fontfamily.gulim') + '<span class="tx-txt">(가나다라)</span>', title: TXMSG('@fontfamily.gulim'), data: 'Gulim,굴림', klass: 'tx-gulim' },
				    { label: TXMSG('@fontfamily.batang') + '<span class="tx-txt">(가나다라)</span>', title: TXMSG('@fontfamily.batang'), data: 'Batang,바탕', klass: 'tx-batang' },
				    { label: TXMSG('@fontfamily.dotum') + '<span class="tx-txt">(가나다라)</span>', title: TXMSG('@fontfamily.dotum'), data: 'Dotum,돋움', klass: 'tx-dotum' },
				    { label: TXMSG('@fontfamily.gungsuh') + '<span class="tx-txt">(가나다라)</span>', title: TXMSG('@fontfamily.gungsuh'), data: 'Gungsuh,궁서', klass: 'tx-gungseo' },
				    { label: TXMSG('@fontfamily.malgungothic') + '<span class="tx-txt">(가나다라)</span>', title: TXMSG('@fontfamily.malgungothic'), data: font_malgungothic, klass: 'tx-malgungothic' },

				    { label: 'Arial <span class="tx-txt">(abcde)</span>', title: 'Arial', data: 'Arial', klass: 'tx-arial' },
				    { label: TXMSG('@fontfamily.comicsansms') + '<span class="tx-txt">(abcde)</span>', title: TXMSG('@fontfamily.comicsansms'), data: "'Comic Sans Ms'", klass: 'tx-comicsansms' },
				    { label: TXMSG('@fontfamily.couriernew') + '<span class="tx-txt">(abcde)</span>', title: TXMSG('@fontfamily.couriernew'), data: "'Courier New'", klass: 'tx-couriernew' },
				    { label: TXMSG('@fontfamily.tahoma') + '<span class="tx-txt">(abcde)</span>', title: TXMSG('@fontfamily.tahoma'), data: 'Tahoma', klass: 'tx-tahoma' },
				    { label: TXMSG('@fontfamily.timesnewroman') + '<span class="tx-txt">(abcde)</span>', title: TXMSG('@fontfamily.timesnewroman'), data: "'Times New Roman'", klass: 'tx-timesnewroman' },
				    { label: 'Verdana <span class="tx-txt">(abcde)</span>', title: 'Verda..', data: 'Verdana', klass: 'tx-verdana' }
		        ]
		    }
		},

		size: {
			contentWidth: 700 /* 지정된 본문영역의 넓이가 있을 경우에 설정 */
		},  
		events: {
            preventUnload: false
        }

	});
	
    var EditorManager = {
        validator: '',
        
        init: function(){
			this.validator = new Trex.Validator();
        },
        
        setFocus: function(){
            Editor.focusOnBottom();
        },
            
        saveHtml : function(){
            //완전한 html를 얻기위해 source모드일경우는 html모드로 변경한다.
            if(Editor.getCanvas().mode == "source"){
                Editor.getCanvas().changeMode('html');
            }
            
            var _content = Editor.getContent();
            if(!this.validator.exists(_content)){
                document.getElementById('daumEditorContent').value = "";
            }else{
                document.getElementById('daumEditorContent').value = _content;
            }
        },
            
        
        getHtml : function(){
            this.saveHtml();
            return document.getElementById('daumEditorContent').value;
        },
        
        pasteContent : function(html){
        
        /**
		 * 선택한 영역에 HTML 컨텐츠를 삽입한다.
		 * @param {String} content - 삽입하고자 하는 HTML 컨텐츠

		 * @param {Boolean} newline - 현재 영역에서 한줄을 띄운 후 삽입할지 여부 true/false
		 * @param {Object} wrapStyle - wrapper 노드에 적용할 스타일, <br/>
		 * 					newline이 true 일 경우에만 의미를 갖는다.
		 */

        
            Editor.getCanvas().pasteContent(html, true);
            Editor.getCanvas().history.saveHistory();
        },
        
        pasteContentBottom: function(html){
        
            Editor.modify({
                content: Editor.getContent() + html
            });
            Editor.focusOnBottom();
        },
        
		loadContent: function (html) {
            if (html != "") {
                document.getElementById("editor_placeholder").style.display = "none";
			}

            document.getElementById("daumEditorContent").value = html;
            
            Editor.modify({
                content: html
            });
        
            //페이지 로딩시 에디터 포커스 제거, 툴바 컨텐츠 본문에 삽입시 포커스가 없어서 삽입안되는 문제가 있어서, 툴바 클릭시 포커스 생기게 처리 
            Editor.getToolbar().observeJob(Trex.Ev.__TOOL_CLICK, function (type) {
                if ($tx.msie)
                    Editor.focus();
            });
        }
    };
   
    //초기화
    EditorManager.init();
    EditorManager.loadContent(document.getElementById('bookDesc').value);

    //모바일 에디터는 지원되지 않기때문에 text 모드 사용한다.
    

   
    //이미지넣기 팝업에서 호출됨 
    function InsertHtml(img){
        EditorManager.pasteContent(img);
    }
// ]]>
    
/*=====*/

											    $j(function(){
											        // c2cRecordPage.isEnableC2cStandbyItem = true;
											    });
											
/*=====*/

											        $j(function(){
											            $j("#c2cItemBottomNotice").show();
											        });
											    
/*=====*/

        $j(document).ready(function () {
            c2cRecordPage.init();
            bindShowAgreeTermsLayer(0);
        });
    
/*=====*/

        $j(document).ready(function () {
            if ($j("#isForceAgree").val() == "1") {
                return;
            }
            //if(getCookie("coverImgGuideClose") != "1") {
            //    // $j("#coverImgGuide").show();
            //    if($j("#simplemodal-overlay").css("display") != "block") {				
			//		$j('#coverImgGuide').modal({
			//			autoResize: true, escClose: false,
			//			containerCss: { width: 500, height: 500 }
			//		});				
			//	}
            //}	
		});

		//function coverImgGuide_close(){
		//	// $j("#coverImgGuide").hide();
		//	try {
        //    	$j.modal.close();
        //	} catch (ex) { }
		//	setCookie('coverImgGuideClose',"1",999);
		//}
	
/*=====*/

$j(document).ready(function () {
    $j("#optFindCvsLocation").val("");

    $j("#optFindCvsLocation").change(function(e){
        var cvsUrl = this.value;

        if(cvsUrl == "") {
            return;
        }

        // alert(cvsUrl);
        location.href = cvsUrl;
    })
});

// function FindCVSPopupShow()
// {
//     if ("ActiveXObject" in window) 
//     {   // ie
//         window.open('http://was.cvsnet.co.kr/GIS/ZERO/terminal/cvsnet_shop_home_terminal_gshome.jsp', 'cvsnet','width=1000,height=680,status=0');
//     }
//     else 
//     {   // not ie
//         window.open('/ucl/account/wa_FindCVSLayer.aspx', 'FindCVS','width=420,height=620,status=0,scrollbars=1');
//     }
// }

/*=====*/

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'markdownkey': '8513756'
    });

/*=====*/
(function (w, d, s, l, i) {
w[l] = w[l] || []; w[l].push({
'gtm.start':
new Date().getTime(), event: 'gtm.js'
}); var f = d.getElementsByTagName(s)[0],
j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-NFVWV75');
/*=====*/
(function(a,e,b,f,g,c,d){a[b]=a[b]||function(){(a[b].q=a[b].q||[]).push(arguments)};c=e.createElement(f);c.async=1;c.src="https://www.clarity.ms/tag/"+g;d=e.getElementsByTagName(f)[0];d.parentNode.insertBefore(c,d)})(window,document,"clarity","script","u5bx3exnb0");
/*=====*/
if(!wcs_add)var wcs_add={};wcs_add.wa="s_1c519d64863a";if(!_nasa)var _nasa={};wcs.inflow("aladin.co.kr");wcs_do(_nasa);
/*=====*/
if(!wcs_add)var wcs_add={};wcs_add.wa="b78bdfda7ab45";window.wcs&&wcs_do();