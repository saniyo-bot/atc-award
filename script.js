      //Mobile menu
  const MobileMenu = (function() {
            // Configuration
            const COURSES_PER_PAGE = 10;
            
            // Private variables
            let courseCategories = {};
            let currentView = 'categories';
            let currentCategory = null;
            let categoryIds = [];
            let currentCategoryIndex = 0;
            let currentPage = 0;
            let totalPages = 0;

            // DOM Elements
            const dom = {
                mobileHeader: null,
                coursesBtn: null,
                menuToggle: null,
                coursesDropdown: null,
                menuDropdown: null,
                closeBtns: null,
                backBtn: null,
                coursesContent: null,
                menuCategories: null,
                prevBtn: null,
                nextBtn: null
            };

            // Initialize the menu
            // function init() {
            //     if (!cacheDom()) {
            //         console.error('Mobile menu elements not found');
            //         return;
            //     }
            //     loadCategories();
            //     setupEventListeners();
            // }
            function adjustViewportHeight() {
              const headerHeight = document.querySelector('.mobile-nav-bar')?.offsetHeight || 60;
              const dropdowns = document.querySelectorAll('.mobile-courses-dropdown, .mobile-menu-dropdown');
              
              dropdowns.forEach(dropdown => {
                  if (dropdown) {
                      dropdown.style.top = `${headerHeight}px`;
                      dropdown.style.height = `calc(100vh - ${headerHeight}px)`;
                  }
              });
          }

          // Call this in your init function
          function init() {
              if (!cacheDom()) {
                  console.error('Mobile menu elements not found');
                  return;
              }
              adjustViewportHeight(); // Add this line
              loadCategories();
              setupEventListeners();
              setupExpandableSubmenus();
              // Handle viewport changes
              window.addEventListener('resize', adjustViewportHeight);
          }

            // Cache DOM elements with null checks
            function cacheDom() {
                dom.mobileHeader = document.querySelector('.mobile-header');
                if (!dom.mobileHeader) return false;
                
                dom.coursesBtn = document.querySelector('.mobile-courses-btn');
                dom.menuToggle = document.querySelector('.mobile-menu-toggle');
                dom.coursesDropdown = document.querySelector('.mobile-courses-dropdown');
                dom.menuDropdown = document.querySelector('.mobile-menu-dropdown');
                dom.closeBtns = document.querySelectorAll('.close-btn');
                dom.backBtn = document.querySelector('.courses-header .back-btn');
                dom.coursesContent = document.querySelector('.courses-content');
                dom.menuCategories = document.querySelector('.menu-categories');
                dom.prevBtn = document.querySelector('.prev-btn');
                dom.nextBtn = document.querySelector('.next-btn');
                
                // Verify all required elements exist
                const requiredElements = [
                    dom.coursesBtn, dom.menuToggle, dom.coursesDropdown, 
                    dom.menuDropdown, dom.backBtn, dom.coursesContent,
                    dom.menuCategories, dom.prevBtn, dom.nextBtn
                ];
                
                return requiredElements.every(el => el !== null);
            }

            // START: Expandable submenu logic
              function setupExpandableSubmenus() {
                  const submenuToggles = dom.menuDropdown.querySelectorAll('.has-submenu > a');

                  submenuToggles.forEach(toggle => {
                      toggle.addEventListener('click', (e) => {
                          e.preventDefault();
                          const parent = toggle.parentElement;

                          // Close others if needed
                          dom.menuDropdown.querySelectorAll('.has-submenu').forEach(item => {
                              if (item !== parent) item.classList.remove('open');
                          });

                          // Toggle current
                          parent.classList.toggle('open');
                      });
                  });
              }
              // END


            // Load categories from DOM data attribute with error handling
            function loadCategories() {
                try {
                    if (!dom.coursesContent) {
                        throw new Error('Courses content element not found');
                    }
                    
                    const categoriesData = dom.coursesContent.getAttribute('data-categories');
                    if (!categoriesData) {
                        throw new Error('No categories data attribute found');
                    }
                    
                    const parsedData = JSON.parse(categoriesData);
                    if (typeof parsedData !== 'object' || parsedData === null) {
                        throw new Error('Invalid categories data format');
                    }
                    
                    courseCategories = {};
                    for (const [key, value] of Object.entries(parsedData)) {
                        if (typeof value !== 'object' || !value.name || !Array.isArray(value.courses)) {
                            console.warn(`Skipping invalid category: ${key}`);
                            continue;
                        }
                        
                        courseCategories[key] = {
                            name: escapeHtml(value.name),
                            courses: value.courses.map(course => escapeHtml(course))
                        };
                    }
                    
                    categoryIds = Object.keys(courseCategories);
                    
                    if (categoryIds.length === 0) {
                        console.warn('No valid categories found');
                    }
                    
                    renderCategories(dom.coursesContent);
                    renderCategories(dom.menuCategories);
                    
                } catch (error) {
                    console.error('Failed to load categories:', error.message);
                    courseCategories = {};
                    categoryIds = [];
                    // Render empty state or show error message
                    if (dom.coursesContent) dom.coursesContent.innerHTML = '<div class="error-message">No courses available</div>';
                    if (dom.menuCategories) dom.menuCategories.innerHTML = '<div class="error-message">No categories available</div>';
                }
            }

            // HTML escaping for security
            function escapeHtml(unsafe) {
                if (typeof unsafe !== 'string') return unsafe;
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }

            // Render categories to a container with null checks
            function renderCategories(container) {
                if (!container) return;
                
                const isMenu = container.classList.contains('menu-categories');
                const categoriesContainer = isMenu ? container : createCategoryLevel(container, 1);
                
                if (!categoriesContainer) return;
                
                categoriesContainer.innerHTML = '';
                
                if (categoryIds.length === 0) {
                    categoriesContainer.innerHTML = '<div class="empty-message">No categories available</div>';
                    return;
                }
                
                categoryIds.forEach(categoryId => {
                    const category = courseCategories[categoryId];
                    if (!category) return;
                    
                    const categoryItem = document.createElement('button');
                    categoryItem.className = 'category-item';
                    categoryItem.dataset.category = categoryId;
                    categoryItem.innerHTML = `
                        ${category.name}
                        <i class="fas fa-chevron-right"></i>
                    `;
                    categoriesContainer.appendChild(categoryItem);
                });
            }

            // Create a category level container with null checks
            function createCategoryLevel(parent, level) {
                if (!parent) return null;
                
                const levelContainer = document.createElement('div');
                levelContainer.className = `category-level ${level === 1 ? 'active' : ''}`;
                levelContainer.dataset.level = level;
                parent.appendChild(levelContainer);
                return levelContainer;
            }

            // Render courses for a category with null checks
            function renderCourses(categoryId) {
                if (!dom.coursesContent || !courseCategories[categoryId]) return;
                
                let coursesContainer = dom.coursesContent.querySelector(`.category-level[data-level="2"][data-parent="${categoryId}"]`);
                
                if (!coursesContainer) {
                    coursesContainer = document.createElement('div');
                    coursesContainer.className = 'category-level';
                    coursesContainer.dataset.level = '2';
                    coursesContainer.dataset.parent = categoryId;
                    dom.coursesContent.appendChild(coursesContainer);
                }
                
                if (!coursesContainer) return;
                
                // Calculate pagination
                totalPages = Math.ceil(courseCategories[categoryId].courses.length / COURSES_PER_PAGE);
                currentPage = 0;
                
                updateCoursesDisplay(coursesContainer, courseCategories[categoryId]);
                updatePaginationButtons();
            }

            // Update displayed courses based on current page
            function updateCoursesDisplay(container, category) {
                if (!container || !category) return;
                
                container.innerHTML = '';
                
                const start = currentPage * COURSES_PER_PAGE;
                const end = start + COURSES_PER_PAGE;
                const visibleCourses = category.courses.slice(start, end);
                
                if (visibleCourses.length === 0) {
                    container.innerHTML = '<div class="empty-message">No courses available</div>';
                    return;
                }
                
                visibleCourses.forEach(course => {
                    const courseItem = document.createElement('a');
                    courseItem.className = 'course-item';
                    courseItem.href = '#';
                    courseItem.textContent = course;
                    container.appendChild(courseItem);
                });
            }

            // Update pagination buttons state
            function updatePaginationButtons() {
                if (!dom.prevBtn || !dom.nextBtn) return;
                
                dom.prevBtn.disabled = currentPage <= 0;
                dom.nextBtn.disabled = currentPage >= totalPages - 1;
            }

            // Set up event listeners with null checks
            function setupEventListeners() {
                if (!dom.coursesBtn || !dom.menuToggle || !dom.coursesDropdown || !dom.menuDropdown) return;
                
                // Toggle dropdowns
                dom.coursesBtn.addEventListener('click', () => {
                    dom.coursesDropdown.classList.add('active');
                    dom.menuDropdown.classList.remove('active');
                    resetNavigation();
                });

                dom.menuToggle.addEventListener('click', () => {
                    dom.menuDropdown.classList.add('active');
                    dom.coursesDropdown.classList.remove('active');
                });

                // Close dropdowns
                dom.closeBtns.forEach(btn => {
                    btn?.addEventListener('click', () => {
                        dom.coursesDropdown?.classList.remove('active');
                        dom.menuDropdown?.classList.remove('active');
                    });
                });

                // Navigation buttons
                dom.backBtn?.addEventListener('click', showCategoriesView);
                dom.prevBtn?.addEventListener('click', showPrevPage);
                dom.nextBtn?.addEventListener('click', showNextPage);

                // Delegate category item clicks
                document.addEventListener('click', (e) => {
                    const categoryItem = e.target.closest('.category-item');
                    if (categoryItem) {
                        handleCategoryClick(categoryItem, e.target.closest('.menu-categories') !== null);
                    }
                });
            }

            // Handle category click
            function handleCategoryClick(categoryItem, fromMenu = false) {
                if (!categoryItem?.dataset?.category) return;
                
                currentCategory = categoryItem.dataset.category;
                currentCategoryIndex = categoryIds.indexOf(currentCategory);
                renderCourses(currentCategory);
                
                if (fromMenu && dom.menuDropdown && dom.coursesDropdown) {
                    dom.menuDropdown.classList.remove('active');
                    dom.coursesDropdown.classList.add('active');
                }
                
                showCoursesView();
            }

            // Pagination functions
            function showPrevPage() {
                if (currentPage <= 0 || !currentCategory) return;
                
                currentPage--;
                const coursesContainer = dom.coursesContent?.querySelector(`.category-level[data-parent="${currentCategory}"]`);
                if (coursesContainer) {
                    updateCoursesDisplay(coursesContainer, courseCategories[currentCategory]);
                    updatePaginationButtons();
                }
            }

            function showNextPage() {
                if (currentPage >= totalPages - 1 || !currentCategory) return;
                
                currentPage++;
                const coursesContainer = dom.coursesContent?.querySelector(`.category-level[data-parent="${currentCategory}"]`);
                if (coursesContainer) {
                    updateCoursesDisplay(coursesContainer, courseCategories[currentCategory]);
                    updatePaginationButtons();
                }
            }

            // View management
            function showCategoriesView() {
                currentView = 'categories';
                document.querySelectorAll('.category-level').forEach(l => l?.classList.remove('active'));
                const level1 = dom.coursesContent?.querySelector('.category-level[data-level="1"]');
                if (level1) level1.classList.add('active');
                if (dom.backBtn) dom.backBtn.style.visibility = 'hidden';
                updatePaginationButtons();
            }

            function showCoursesView() {
                currentView = 'courses';
                document.querySelectorAll('.category-level').forEach(l => l?.classList.remove('active'));
                const currentLevel = dom.coursesContent?.querySelector(`.category-level[data-parent="${currentCategory}"]`);
                if (currentLevel) currentLevel.classList.add('active');
                if (dom.backBtn) dom.backBtn.style.visibility = 'visible';
                updatePaginationButtons();
            }

            function resetNavigation() {
                currentView = 'categories';
                currentCategory = null;
                currentCategoryIndex = 0;
                currentPage = 0;
                showCategoriesView();
            }

            // Public API
            return { init };
        })();

        // Safe initialization
        document.addEventListener('DOMContentLoaded', function() {
            try {
                MobileMenu.init();
            } catch (error) {
                console.error('Mobile menu initialization failed:', error);
            }
        });



document.addEventListener('DOMContentLoaded', function(){

          



    // Mega menu tab functionality
            $('.stack-item').click(function() {
                $('.stack-item').removeClass('active');
                $(this).addClass('active');
                
                var tabId = $(this).data('tab');
                $('.course-tab-content').removeClass('active');
                $('#' + tabId).addClass('active');
            });
                     
            
        
        
    //Preloader
     window.onload = function () {
        document.getElementById("preloader").style.display = "none";
      };

    //cat tab functionality
     $(document).ready(function() {
            // Handle stack item selection
            $('.cat-list-stack-item').click(function() {
                $('.cat-list-stack-item').removeClass('active');
                $(this).addClass('active');
                
                var tabId = $(this).data('tab');
                $('.cat-list-tab-content').removeClass('active');
                $('#' + tabId).addClass('active');
            });
            
            // Initialize mobile collapse state
            if ($(window).width() <= 768) {
                $('#programStackCollapse').removeClass('show');
                $('#filtersCollapse').removeClass('show');
                $('.cat-list-filter-toggle').attr('aria-expanded', 'false');
            } else {
                // For desktop, ensure the collapse is always shown
                $('#filtersCollapse').addClass('show');
                $('.cat-list-filter-toggle').attr('aria-expanded', 'true');
            }
            
            // Toggle hamburger icon on program stack
            $('#programStackCollapse').on('show.bs.collapse', function () {
                $('.cat-list-stack-title .fa-bars').removeClass('fa-bars').addClass('fa-times');
            });
            
            $('#programStackCollapse').on('hide.bs.collapse', function () {
                $('.cat-list-stack-title .fa-times').removeClass('fa-times').addClass('fa-bars');
            });
            
            // Handle window resize to properly initialize collapse states
            $(window).resize(function() {
                if ($(window).width() <= 768) {
                    if (!$('#programStackCollapse').hasClass('show')) {
                        $('.cat-list-stack-title .fa-bars').removeClass('fa-times').addClass('fa-bars');
                    }
                    $('.cat-list-filter-toggle').attr('aria-expanded', $('#filtersCollapse').hasClass('show'));
                } else {
                    // On desktop, force show the filters
                    $('#filtersCollapse').addClass('show');
                    $('.cat-list-filter-toggle').attr('aria-expanded', 'true');
                }
            });
            
            // Prevent filter toggle from working on desktop
            $('.cat-list-filter-toggle').click(function(e) {
                if ($(window).width() > 768) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            });
        });

    //Go to Top
    if($("#goTopBtn")){
       const goTopBtn = document.getElementById("goTopBtn");

        window.addEventListener("scroll", () => {
          if (window.scrollY > 300) {
            goTopBtn.classList.add("show");
          } else {
            goTopBtn.classList.remove("show");
          }
        });

        goTopBtn.addEventListener("click", () => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        });
  }

  //Fixed Header
  if($(".top-header")){
    const header = document.querySelector('.top-header');

    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        header.classList.add('fixed');
      } else {
        header.classList.remove('fixed');
      }
    });

  }

//Program Hamburger functionality
if($(".mobile-tabs-btn")){   // Toggle mobile menu
 $(document).ready(function() {
  // Toggle mobile menu
  $('#mobileTabsBtn').click(function() {
    $(this).toggleClass('active');
    $('#mobileTabsMenu').toggleClass('show');
  });
  
  // Handle mobile tab clicks
  $('.mobile-tab-link').click(function(e) {
    e.preventDefault();
    
    // Update active state
    $('.mobile-tab-link').removeClass('active');
    $(this).addClass('active');
    
    // Update button text
    $('#mobileTabsBtn').text($(this).text());
    
    // Close menu
    $('#mobileTabsBtn').removeClass('active');
    $('#mobileTabsMenu').removeClass('show');
    
    // Get the target tab
    var target = $(this).attr('href');
    
    // Show the corresponding tab content
    $('.tab-pane').removeClass('show active');
    $(target).addClass('show active');
    
    // Update the desktop tabs to match
    $('.desktop-tabs .nav-link').removeClass('active');
    $('.desktop-tabs .nav-link[href="' + target + '"]').addClass('active');
  });
  
  // Sync with Bootstrap tab changes (for desktop)
  $('.desktop-tabs .nav-link').on('shown.bs.tab', function(e) {
    var target = $(e.target).attr('href');
    
    // Update mobile dropdown active state
    $('.mobile-tab-link').removeClass('active');
    $('.mobile-tab-link[href="' + target + '"]').addClass('active');
    
    // Update mobile button text
    var activeText = $(e.target).text().trim();
    $('#mobileTabsBtn').text(activeText);
  });
});
  }

   
//Counter
  if($(".count-number")){
     function initCounters(){
        $(".count-number").appear(function(){
          var count = $(this);
          count.countTo({
            from: 0,
            to: count.html(),
            speed: 1300,
            refreshInterval: 60,
          });
        });
      }

  initCounters();
  }

  //Deals carousel
  if ($(".owl-deal-carousel").length > 0) {
   var dealCar= $(".owl-deal-carousel").owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: false,
      autoplay: false,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
        },
        600: {
          items: 2,
        },
        1000: {
          items: 3,
        },
      },
    });
      $('#deal-right').click(function () {
        dealCar.trigger('next.owl.carousel');
      });

      // Go to the previous item
      $('#deal-left').click(function () {
        dealCar.trigger('prev.owl.carousel');
      });
  }

   //Blog carousel
  if ($(".owl-blog").length > 0) {
   var blogCar= $(".owl-blog").owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: false,
      autoplay: false,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
        },
        600: {
          items: 2,
        },
        1000: {
          items: 3,
        },
        1400: {
          items: 4,
        },
      },
    });
      $('#blog-right').click(function () {
        blogCar.trigger('next.owl.carousel');
      });

      // Go to the previous item
      $('#blog-left').click(function () {
        blogCar.trigger('prev.owl.carousel');
      });
  }

  //program carosel
   if ($("#cyber-carousel").length > 0) {
    $("#cyber-carousel").owlCarousel({
        items: 1,
        loop: true,
        margin: 30,
        nav: true,
        dots: true,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: true
      });
   }  

  //collab Carousel
  if ($(".owl-collab").length > 0) {
  $(".owl-collab").owlCarousel({
      loop: true,
      margin: 10,
      nav: false,
      dots: false,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsiveClass: true,
      responsive: {
        0: {
          items: 2,
        },
        600: {
          items: 2,
        },
        1000: {
          items: 5,
        }
      }
    });
  }

  //Prorame Carousel
  if ($(".owl-tech-prgm").length > 0) {
  var progsli = $(".owl-tech-prgm").owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: false,
      autoplay: false,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
        },
        600: {
          items: 3,
        },
        1000: {
          items: 4,
        },
        1500: {
          items: 5,
        }
      }
    });
     $('#prog-right').click(function () {
        progsli.trigger('next.owl.carousel');
      });

      // Go to the previous item
      $('#prog-left').click(function () {
        progsli.trigger('prev.owl.carousel');
      });
  }

  //Social Carousel
  if ($(".owl-social").length > 0) {
  var socsli = $(".owl-social").owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: false,
      autoplay: false,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
        },
        600: {
          items: 2,
        },
        1000: {
          items: 4,
        }
      }
    });
     $('#social-right').click(function () {
        socsli.trigger('next.owl.carousel');
      });

      // Go to the previous item
      $('#social-left').click(function () {
        socsli.trigger('prev.owl.carousel');
      });
  }


  //Review Carousel
  if ($(".owl-review").length > 0) {
  var reviewsli = $(".owl-review").owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: false,
      autoplay: false,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
        },
        600: {
          items: 2,
        },
        1000: {
          items: 2,
        }
      }
    });
     $('#review-right').click(function () {
        reviewsli.trigger('next.owl.carousel');
      });

      // Go to the previous item
      $('#review-left').click(function () {
        reviewsli.trigger('prev.owl.carousel');
      });
  }

//Vaccancy Apply
  if ($(".apply-btn").length > 0) {
    $('.apply-btn').on('click', function () {
        var position = $(this).data('position');
        if (position) {
          $('#appliedPosition').val(position);
        }
      });
  }


  //course Detail section goto Menu
    if ($(".course-detail-menu-wrapper").length > 0) {
    // Smooth scroll
      // document.querySelectorAll('.course-detail-link').forEach(anchor => {
      //   anchor.addEventListener('click', function(e) {
      //     e.preventDefault();
      //     document.querySelector(this.getAttribute('href')).scrollIntoView({
      //       behavior: 'smooth',
      //       block: 'start'
      //     });

      //     // Optional: update active link
      //     document.querySelectorAll('.course-detail-link').forEach(el => el.classList.remove('active'));
      //     this.classList.add('active');
      //   });
      // });

      // // Sticky course menu logic
      // window.addEventListener('scroll', function () {
      //   const menuWrapper = document.querySelector('.course-detail-menu-wrapper');
      //   const topHeaderHeight = document.querySelector('.top-header').offsetHeight;

      //   if (window.scrollY > topHeaderHeight) {
      //     menuWrapper.classList.add('fixed');
      //   } else {
      //     menuWrapper.classList.remove('fixed');
      //   }
      // });
     

    }



  //Review course detail Carousel
  if ($(".owl-course-det-rev").length > 0) {
  var reviewsli = $(".owl-course-det-rev").owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: true,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
        },
        600: {
          items: 1,
        },
        1000: {
          items: 1,
        }
      }
    });
    
  }

  //Job Roles Fade-In and Fade-out
    if ($(".job-role-box").length > 0) {
         $(document).ready(function () {
          const $groups = $(".job-role-group");
          let currentIndex = 0;

          function showNextGroup() {
            const $current = $groups.eq(currentIndex);
            const nextIndex = (currentIndex + 1) % $groups.length;
            const $next = $groups.eq(nextIndex);

            // Start fade out
            $current.removeClass("active");

            setTimeout(() => {
              // Hide current after fade-out
              $current.css("display", "none");

              // Prepare next group
              $next.css("display", "block");

              // Trigger fade-in
              setTimeout(() => {
                $next.addClass("active");
              }, 50); // Small delay to allow transition
            }, 1000); // Fade-out duration

            currentIndex = nextIndex;
          }

          // Init: show first group
          $groups.hide().eq(0).show().addClass("active");

          // Start loop
          setInterval(showNextGroup, 5000);
        });
    }


  //Top recruiters fade
  //  if ($(".recruiter-box").length > 0) {
  //       $(document).ready(function () {
  //   let rotateStep = 0;

  //   function rotateRecruiters() {
  //   $('.recruiter-box').each(function () {
  //           const $box = $(this);
  //           const logos = JSON.parse($box.attr('data-logos'));
  //           if (!logos || logos.length === 0) return;

  //           const currentImg = $box.find('img').attr('src');
  //           const nextIndex = (logos.indexOf(currentImg) + 1) % logos.length;
  //           const nextLogo = logos[nextIndex];

  //           // Fade out
  //           $box.removeClass('fade-in').addClass('fade-out');

  //           setTimeout(() => {
  //             // Set new image
  //             $box.find('img').attr('src', nextLogo);

  //             // Update background as chess pattern shift
  //             const index = parseInt($box.data('index'));
  //             const row = Math.floor(index / 6);
  //             const col = index % 6;
  //             const shift = rotateStep;
  //             const isEven = (row + col + shift) % 2 === 0;

  //             $box.css('background-color', isEven ? 'var(--light-prim)' : '#ffffff');

  //             // Fade in new image
  //             $box.removeClass('fade-out').addClass('fade-in');
  //           }, 400);
  //         });

  //         rotateStep++;
  //       }

  //       setInterval(rotateRecruiters, 4000);
  //     });
  //  }
  // Top recruiters fade
// Top recruiters fade
if ($(".recruiter-box").length > 0) {
  $(document).ready(function () {
    let rotateStep = 0;

    // Detect if screen is mobile (you can adjust the width threshold if needed)
    const isMobile = window.innerWidth <= 767;

    function rotateRecruiters() {
      $('.recruiter-box').each(function () {
        const $box = $(this);
        const logos = JSON.parse($box.attr('data-logos'));
        if (!logos || logos.length === 0) return;

        const currentImg = $box.find('img').attr('src');
        const nextIndex = (logos.indexOf(currentImg) + 1) % logos.length;
        const nextLogo = logos[nextIndex];

        // Fade out
        $box.removeClass('fade-in').addClass('fade-out');

        setTimeout(() => {
          // Update image
          $box.find('img').attr('src', nextLogo);

          // Desktop: update background in chessboard pattern
          if (!isMobile) {
            const index = parseInt($box.data('index'));
            const row = Math.floor(index / 6);
            const col = index % 6;
            const shift = rotateStep;
            const isEven = (row + col + shift) % 2 === 0;
            $box.css('background-color', isEven ? 'var(--light-prim)' : '#ffffff');
          }

          // Fade in
          $box.removeClass('fade-out').addClass('fade-in');
        }, 400);
      });

      rotateStep++;
    }

    // Start rotation
    setInterval(rotateRecruiters, 4000);
  });
}




   // FAQ toggle
   if ($(".faq-box").length > 0) {
         const faqBoxes = document.querySelectorAll('[data-toggle="faq"]');

          faqBoxes.forEach(box => {
            box.addEventListener('click', () => {
              const isActive = box.classList.contains('active');
              const allBoxes = document.querySelectorAll('[data-toggle="faq"]');
              const allAnswers = document.querySelectorAll('.faq-answer');

              // Close all
              allBoxes.forEach(b => {
                b.classList.remove('active');
                b.querySelector('.faq-icon').textContent = '+';
              });
              allAnswers.forEach(ans => {
                ans.style.maxHeight = null;
                ans.classList.remove('open');
              });

              // Open clicked one if not already active
              if (!isActive) {
                box.classList.add('active');
                box.querySelector('.faq-icon').textContent = '−';
                const answer = box.nextElementSibling;
                answer.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + "px";
              }
            });
          });

          // Reset heights on window resize
          window.addEventListener('resize', () => {
            document.querySelectorAll('.faq-answer.open').forEach(answer => {
              answer.style.maxHeight = answer.scrollHeight + "px";
            });
          });
  }

  //popular programs
  if ($(".owl-popular-program").length > 0) {
   var dealpop= $(".owl-popular-program").owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: false,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
        },
        600: {
          items: 2,
        },
        1000: {
          items: 4,
        },
      },
    });
      $('#pop-right').click(function () {
        dealpop.trigger('next.owl.carousel');
      });

      // Go to the previous item
      $('#pop-left').click(function () {
        dealpop.trigger('prev.owl.carousel');
      });
  }

});
