$(document).ready(function () {

  AOS.init({
  duration: 1000,
  once: false,
  mirror: true,
});
  

  // 메인 슬라이드와 헤더 색상 동기화
  if ($(".main_swiper").length) {
    new Swiper(".main_swiper", {
      slidesPerView: 1,
      loop: true,
      speed: 700,
      pagination: {
        el: ".main_swiper .swiper-pagination",
        clickable: true
      },
      navigation: {
        nextEl: ".main_swiper .visual_next",
        prevEl: ".main_swiper .visual_prev"
      },
      autoplay: {
      delay: 2500,
      disableOnInteraction: false
      },
      on: {
        init: function () {
          setHeader(this);
        },
        slideChange: function () {
          setHeader(this);
        }
      }
    });
  }

  function setHeader(swiper) {
    var names = ["light", "dark", "orange"];
    var name = names[swiper.realIndex] || "light";

    $("header").removeClass("light dark orange").addClass(name);
    $(".main_swiper").attr("data-theme", name);
  }

  // 모바일 메뉴: jQuery 방식
  function closeMenu() {
    $(".mobile_menu").stop(true, true).fadeOut(180, function () {
      $(this).prop("hidden", true).removeAttr("style");
    });
    $(".depth2").hide();
    $(".mobile_depth1").attr("aria-expanded", "false");
    $(".btn_menu").attr("aria-expanded", "false");
    $("body").css("overflow", "");
  }

  $(".btn_menu").click(function () {
    if (!$(".mobile_menu").prop("hidden")) return;
    $(".mobile_menu").prop("hidden", false).hide().fadeIn(180);
    $(this).attr("aria-expanded", "true");
    $("body").css("overflow", "hidden");
    $(".btn_close").trigger("focus");
  });

  $(".btn_close").click(function () {
    closeMenu();
    $(".btn_menu").trigger("focus");
  });

  $(".mobile_depth1").click(function () {
    var opened = $(this).attr("aria-expanded") === "true";

    $(".mobile_depth1").attr("aria-expanded", "false");
    $(".depth2").not($(this).next(".depth2")).stop(true, true).slideUp(180);

    if (opened) {
      $(this).next(".depth2").stop(true, true).slideUp(180);
    } else {
      $(this).attr("aria-expanded", "true");
      $(this).next(".depth2").stop(true, true).slideDown(180);
    }
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && !$(".mobile_menu").prop("hidden")) {
      closeMenu();
      $(".btn_menu").trigger("focus");
    }
  });

  $(window).on("resize", function () {
    if (window.innerWidth >= 768 && !$(".mobile_menu").prop("hidden")) {
      closeMenu();
    }
  });

  // 통합 검색: 배경 dim + 인기/최근 검색어
  function closeSearch() {
    $(".search_overlay").prop("hidden", true);
    $(".btn_search").attr("aria-expanded", "false");
    $("body").css("overflow", "");
    $(".btn_search").trigger("focus");
  }

  $(".btn_search").click(function () {
    if (!$(".search_overlay").prop("hidden")) return;
    $(".search_overlay").prop("hidden", false);
    $(".btn_search").attr("aria-expanded", "true");
    $("body").css("overflow", "hidden");
    $("#site-search").trigger("focus");
  });

  $(".search_close").click(closeSearch);
  $(".search_overlay").click(function (e) {
    if (e.target === this) closeSearch();
  });
  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && !$(".search_overlay").prop("hidden")) closeSearch();
  });

  var recentSearch = [];
  try { recentSearch = JSON.parse(sessionStorage.getItem("samjinRecentSearch") || "[]"); } catch (e) { recentSearch = []; }
  function drawRecent() {
    $(".recent_list").empty();
    $(".recent_empty").toggle(recentSearch.length === 0);
    $.each(recentSearch, function (i, word) {
      var $li = $("<li>");
      $("<span>").text(word).appendTo($li);
      $("<button type='button' aria-label='검색어 삭제'>×</button>").click(function () {
        recentSearch.splice(i, 1);
        sessionStorage.setItem("samjinRecentSearch", JSON.stringify(recentSearch));
        drawRecent();
      }).appendTo($li);
      $(".recent_list").append($li);
    });
  }
  drawRecent();
  $(".clear_recent").click(function () {
    recentSearch = [];
    sessionStorage.removeItem("samjinRecentSearch");
    drawRecent();
  });
  $(".popular_words button").click(function () {
    $("#site-search").val($(this).attr("data-search")).trigger("focus");
  });
  $(".search_form").submit(function () {
    var word = $.trim($("#site-search").val());
    if (word) {
      recentSearch = [word].concat($.grep(recentSearch, function (a) { return a !== word; })).slice(0, 6);
      sessionStorage.setItem("samjinRecentSearch", JSON.stringify(recentSearch));
    }
  });
  $("#portfolio-login").submit(function (e) {
    e.preventDefault();
    $(".login_message").text("포트폴리오 시연용 화면으로 실제 로그인은 지원하지 않습니다.");
  });
  $(".sns_login button").click(function () {
    $(".login_message").text("소셜 로그인은 포트폴리오 시연용으로 연결되지 않습니다.");
  });

/* ==================================
   PRODUCTS: Swiper + 카테고리 필터
================================== */

if ($("#products .products_swiper").length) {

  var productSwiper = null;
  var $productsWindow = $("#products .products_window");
  var $productWrapper = $("#products .swiper-wrapper");

  // 최초 상품 4개를 원본으로 저장
  var originalSlides = $productWrapper
    .children(".swiper-slide")
    .map(function () {
      return this.outerHTML;
    })
    .get();

  var productCount = originalSlides.length;

  // 현재 카테고리에 해당하는 상품 가져오기
  function getFilteredSlides(category) {
    return originalSlides.filter(function (html) {
      if (category === "all") return true;

      var element = $(html);
      return element.attr("data-category") === category;
    });
  }

  // 기존 Swiper 제거
  function destroyProductSwiper() {
    if (productSwiper) {
      productSwiper.destroy(true, true);
      productSwiper = null;
    }
  }

  // 전체 상품: 반복 슬라이더 생성
  function showAllProducts() {
    destroyProductSwiper();

    $productsWindow.removeClass("is-filtered");

    // 기존 4종의 상품을 여러 번 반복 구성
    var repeatedSlides = [];

    for (var i = 0; i < 10; i++) {
      repeatedSlides = repeatedSlides.concat(originalSlides);
    }

    $productWrapper.html(repeatedSlides.join(""));

    // 중간 지점에서 슬라이드 시작
    var startIndex = productCount * 4;

    productSwiper = new Swiper(
      "#products .products_swiper",
      {
        slidesPerView: 1,
        spaceBetween: 16,
        speed: 700,
        loop: false,
        initialSlide: startIndex,

        // 자동 슬라이드
        autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
        },

        breakpoints: {
          // 태블릿: 4장 분량
          768: {
            slidesPerView: 4,
            spaceBetween: 20
          },

          // PC: 6장 분량
          1200: {
            slidesPerView: 6,
            spaceBetween: 24
          }
        },

        on: {
          slideChangeTransitionEnd: function () {
            var currentIndex = this.activeIndex;
            var total = this.slides.length;

            // 화면별 최대 표시 슬라이드 수
            var visibleCount = 1;

            if (window.innerWidth >= 1200) {
              visibleCount = 6;
            } else if (window.innerWidth >= 768) {
              visibleCount = 4;
            }

            // 배열의 양 끝에 접근하면
            // 동일한 상품 순서의 중간 위치로 이동
            if (
              currentIndex < productCount * 2 ||
              currentIndex >
                total - visibleCount - productCount * 2
            ) {
              var newIndex =
                productCount * 4 +
                (currentIndex % productCount);

              this.slideTo(newIndex, 0, false);
            }
          }
        }
      }
    );
  }

  // 필터 상품: 반복 없이 해당 상품만 표시
  function showFilteredProducts(category) {
    destroyProductSwiper();

    var filteredSlides = getFilteredSlides(category);

    $productsWindow.addClass("is-filtered");
    $productWrapper.html(filteredSlides.join(""));
  }

  // 필터 버튼 클릭
  $("#products .product_filters button").on(
    "click",
    function () {
      var category = $(this).attr("data-filter");

      // 선택 버튼 활성화
      $(this)
        .addClass("active")
        .attr("aria-pressed", "true")
        .siblings("button")
        .removeClass("active")
        .attr("aria-pressed", "false");

      // 카테고리별 상품 변경
      if (category === "all") {
        showAllProducts();
      } else {
        showFilteredProducts(category);
      }
    }
  );

  // 페이지 최초 실행
  showAllProducts();
}

  


});
