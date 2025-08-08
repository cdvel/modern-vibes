/**
 * Modern Personal Theme - Main JavaScript
 * Handles view toggle, lazy loading, and subscribe functionality
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        postsPerPage: 9,
        animationDuration: 300,
        debounceDelay: 100
    };

    // Utility functions
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const fadeIn = (element, duration = CONFIG.animationDuration) => {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const tick = () => {
            element.style.opacity = +element.style.opacity + (16 / duration);
            if (+element.style.opacity < 1) {
                requestAnimationFrame(tick);
            }
        };
        tick();
    };

    const fadeOut = (element, duration = CONFIG.animationDuration) => {
        element.style.opacity = '1';
        
        const tick = () => {
            element.style.opacity = +element.style.opacity - (16 / duration);
            if (+element.style.opacity > 0) {
                requestAnimationFrame(tick);
            } else {
                element.style.display = 'none';
            }
        };
        tick();
    };

    // View Toggle Functionality
    class ViewToggle {
        constructor() {
            this.container = document.getElementById('posts-container');
            this.gridBtn = document.querySelector('.view-toggle.grid-view');
            this.listBtn = document.querySelector('.view-toggle.list-view');
            this.currentView = 'grid';

            this.init();
        }

        init() {
            if (!this.container || !this.gridBtn || !this.listBtn) return;

            // Load saved preference
            this.currentView = localStorage.getItem('viewPreference') || 'grid';
            this.setView(this.currentView);

            // Event listeners
            this.gridBtn.addEventListener('click', () => this.toggleView('grid'));
            this.listBtn.addEventListener('click', () => this.toggleView('list'));
        }

        toggleView(view) {
            if (this.currentView === view) return;

            this.currentView = view;
            this.setView(view);
            localStorage.setItem('viewPreference', view);
        }

        setView(view) {
            // Update container classes
            this.container.className = `posts-container ${view}-layout`;

            // Update button states
            this.gridBtn.classList.toggle('active', view === 'grid');
            this.listBtn.classList.toggle('active', view === 'list');

            // Animate cards
            this.animateCards();
        }

        animateCards() {
            const cards = this.container.querySelectorAll('.post-card');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 50}ms`;
                card.classList.add('fade-in');
            });
        }
    }

    // Lazy Loading Functionality
    class LazyLoader {
        constructor() {
            this.loadMoreBtn = document.getElementById('load-more-btn');
            this.loadingSpinner = document.getElementById('loading-spinner');
            this.postsContainer = document.getElementById('posts-container');
            this.currentPage = 1;
            this.isLoading = false;

            this.init();
        }

        init() {
            if (!this.loadMoreBtn || !this.postsContainer) return;

            this.loadMoreBtn.addEventListener('click', this.loadMorePosts.bind(this));
        }

        async loadMorePosts() {
            if (this.isLoading) return;

            this.isLoading = true;
            this.showLoading(true);

            try {
                const nextPageUrl = this.loadMoreBtn.dataset.nextPage;
                if (!nextPageUrl) return;

                const response = await fetch(nextPageUrl);
                if (!response.ok) throw new Error('Failed to load posts');

                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Extract new posts
                const newPosts = doc.querySelectorAll('.post-card');
                const newLoadMoreBtn = doc.getElementById('load-more-btn');

                // Add new posts with animation
                this.addNewPosts(newPosts);

                // Update load more button
                this.updateLoadMoreButton(newLoadMoreBtn);

                this.currentPage++;

            } catch (error) {
                console.error('Error loading more posts:', error);
            } finally {
                this.isLoading = false;
                this.showLoading(false);
            }
        }

        addNewPosts(newPosts) {
            newPosts.forEach((post, index) => {
                // Clone the post element
                const postClone = post.cloneNode(true);
                postClone.style.opacity = '0';
                postClone.style.transform = 'translateY(20px)';
                
                this.postsContainer.appendChild(postClone);

                // Animate in
                setTimeout(() => {
                    postClone.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    postClone.style.opacity = '1';
                    postClone.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }

        updateLoadMoreButton(newLoadMoreBtn) {
            if (newLoadMoreBtn && newLoadMoreBtn.dataset.nextPage) {
                this.loadMoreBtn.dataset.nextPage = newLoadMoreBtn.dataset.nextPage;
            } else {
                // No more posts to load
                this.loadMoreBtn.style.display = 'none';
            }
        }

        showLoading(show) {
            if (!this.loadingSpinner) return;

            if (show) {
                this.loadMoreBtn.disabled = true;
                this.loadingSpinner.classList.remove('hidden');
            } else {
                this.loadMoreBtn.disabled = false;
                this.loadingSpinner.classList.add('hidden');
            }
        }

    }

    // Subscribe Form Functionality
    class SubscribeForm {
        constructor() {
            this.forms = document.querySelectorAll('[data-members-form="subscribe"]');
            this.init();
        }

        init() {
            this.forms.forEach(form => {
                form.addEventListener('submit', this.handleSubmit.bind(this));
            });
        }

        async handleSubmit(e) {
            e.preventDefault();

            const form = e.target;
            const email = form.querySelector('input[name="email"]').value;
            const submitBtn = form.querySelector('.subscribe-btn');
            const btnContent = submitBtn.querySelector('.subscribe-btn-content');
            const btnLoader = submitBtn.querySelector('.subscribe-btn-loader');
            const successEl = form.querySelector('.subscribe-success');
            const errorEl = form.querySelector('.subscribe-error');

            // Reset states
            this.hideMessage(successEl);
            this.hideMessage(errorEl);

            // Validate email
            if (!this.isValidEmail(email)) {
                this.showMessage(errorEl, 'Please enter a valid email address!');
                return;
            }

            // Show loading state
            btnContent.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            submitBtn.disabled = true;

            try {
                // Submit to Ghost Members API
                const response = await fetch('/members/api/send-magic-link/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        emailType: 'subscribe'
                    })
                });

                if (response.ok) {
                    this.showMessage(successEl, 'Great! Check your inbox and click the link to confirm your subscription.');
                    form.reset();
                } else {
                    throw new Error('Subscription failed');
                }

            } catch (error) {
                console.error('Subscription error:', error);
                this.showMessage(errorEl, 'Something went wrong. Please try again later.');
            } finally {
                // Reset button state
                btnContent.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                submitBtn.disabled = false;
            }
        }

        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        showMessage(element, message) {
            if (!element) return;
            element.querySelector('p').textContent = message;
            element.classList.remove('hidden');
        }

        hideMessage(element) {
            if (!element) return;
            element.classList.add('hidden');
        }
    }

    // Image Lazy Loading
    class ImageLazyLoading {
        constructor() {
            this.images = document.querySelectorAll('img[loading="lazy"]');
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.setupIntersectionObserver();
            } else {
                // Fallback for older browsers
                this.loadAllImages();
            }
        }

        setupIntersectionObserver() {
            const options = {
                threshold: 0.1,
                rootMargin: '50px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, options);

            this.images.forEach(img => observer.observe(img));
        }

        loadImage(img) {
            img.addEventListener('load', () => {
                img.classList.add('fade-in');
            });

            // Trigger load if not already loaded
            if (!img.complete) {
                img.loading = 'eager';
            }
        }

        loadAllImages() {
            this.images.forEach(img => this.loadImage(img));
        }
    }

    // Smooth Scrolling for Anchor Links
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a[href^="#"]');
                if (!target) return;

                const href = target.getAttribute('href');
                if (href === '#') return;

                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        }
    }


    // Code Highlighting Class
    class CodeHighlighter {
        constructor() {
            this.init();
        }

        init() {
            if (typeof hljs !== 'undefined') {
                // Configure highlight.js
                hljs.configure({
                    languages: ['javascript', 'python', 'html', 'css', 'bash', 'json', 'sql', 'yaml', 'xml', 'typescript', 'jsx', 'tsx']
                });
                
                // Highlight all code blocks
                hljs.highlightAll();
                
                // Add copy button to code blocks
                this.addCopyButtons();
            }
        }

        addCopyButtons() {
            const codeBlocks = document.querySelectorAll('pre code');
            codeBlocks.forEach(codeBlock => {
                const pre = codeBlock.parentElement;
                const button = document.createElement('button');
                button.className = 'copy-code-btn';
                button.textContent = 'Copy';
                button.addEventListener('click', () => this.copyCode(codeBlock, button));
                
                pre.style.position = 'relative';
                pre.appendChild(button);
            });
        }

        async copyCode(codeBlock, button) {
            try {
                const text = codeBlock.textContent;
                await navigator.clipboard.writeText(text);
                
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.background = 'var(--color-success)';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
            }
        }
    }

    // Table of Contents Class
    class TableOfContents {
        constructor() {
            this.tocElement = document.getElementById('toc');
            this.contentElement = document.querySelector('.js-toc-content');
            this.init();
        }

        init() {
            if (!this.tocElement || !this.contentElement || typeof tocbot === 'undefined') return;

            // Check if there are headings in the content
            const headings = this.contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headings.length < 2) return;

            // Initialize tocbot
            tocbot.init({
                tocSelector: '#toc',
                contentSelector: '.js-toc-content',
                headingSelector: 'h1, h2, h3, h4, h5, h6',
                hasInnerContainers: true,
                linkClass: 'toc-link',
                activeLinkClass: 'is-active',
                listClass: 'toc-list',
                listItemClass: 'toc-list-item',
                collapsibleClass: 'is-collapsible',
                isCollapsedClass: 'is-collapsed',
                collapseDepth: 3,
                scrollSmooth: true,
                scrollSmoothDuration: 420,
                headingsOffset: 80,
                throttleTimeout: 50,
                positionFixedSelector: '.toc-container',
                positionFixedClass: 'is-position-fixed',
                fixedSidebarOffset: 'auto'
            });

            // Show TOC container
            const tocContainer = document.querySelector('.toc-container');
            if (tocContainer) {
                tocContainer.classList.add('show');
            }
        }

        destroy() {
            if (typeof tocbot !== 'undefined') {
                tocbot.destroy();
            }
        }
    }

    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        new ViewToggle();
        new LazyLoader();
        new SubscribeForm();
        new ImageLazyLoading();
        new SmoothScroll();
        new CodeHighlighter();
        new TableOfContents();
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Re-initialize lazy loading for any new images
            new ImageLazyLoading();
        }
    });

})();