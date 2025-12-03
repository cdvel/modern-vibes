/**
 * External Images Handler for Ghost Theme
 * Allows using external image URLs as post thumbnails via HTML comments
 * Usage: Add <!-- external-image: https://example.com/image.jpg --> to post content
 */

(function() {
    'use strict';

    /**
     * Extract external image URL from content
     * @param {string} content - HTML content to parse
     * @returns {string|null} - External image URL or null
     */
    function extractExternalImageUrl(content) {
        if (!content) return null;

        // Match HTML comment with external-image marker
        const regex = /<!--\s*external-image:\s*([^\s]+)\s*-->/i;
        const match = content.match(regex);

        if (match && match[1]) {
            // Validate URL
            try {
                const url = new URL(match[1]);
                return url.href;
            } catch (e) {
                console.warn('Invalid external image URL:', match[1]);
                return null;
            }
        }

        return null;
    }

    /**
     * Replace image source with external URL
     * @param {HTMLElement} element - Image element or container
     * @param {string} externalUrl - External image URL
     */
    function replaceImageSource(element, externalUrl) {
        if (!element || !externalUrl) return;

        const img = element.tagName === 'IMG' ? element : element.querySelector('img');
        if (img) {
            // Store original source as fallback
            img.dataset.originalSrc = img.src;

            // Set external URL
            img.src = externalUrl;

            // Handle load errors - fallback to original
            img.onerror = function() {
                if (this.dataset.originalSrc && this.src !== this.dataset.originalSrc) {
                    console.warn('Failed to load external image, falling back to original:', externalUrl);
                    this.src = this.dataset.originalSrc;
                }
            };
        }
    }

    /**
     * Process post cards on listing pages
     */
    function processPostCards() {
        const postCards = document.querySelectorAll('.post-card[data-post-content]');

        postCards.forEach(card => {
            const content = card.dataset.postContent;
            const externalUrl = extractExternalImageUrl(content);

            if (externalUrl) {
                const imageContainer = card.querySelector('.post-image');
                if (imageContainer) {
                    replaceImageSource(imageContainer, externalUrl);
                }
            }
        });
    }

    /**
     * Process individual post/page
     */
    function processFullPost() {
        const postContent = document.querySelector('.post-content, .page-content');
        if (!postContent) return;

        // Get the raw content
        const content = postContent.innerHTML;
        const externalUrl = extractExternalImageUrl(content);

        if (externalUrl) {
            // Update featured image
            const featuredImage = document.querySelector('.post-full-image img, .page-image img');
            if (featuredImage) {
                replaceImageSource(featuredImage, externalUrl);
            }

            // Update related posts if they're for the same post
            const relatedPosts = document.querySelectorAll('.read-next-card');
            relatedPosts.forEach(card => {
                // Check if this card needs external image
                const cardContent = card.dataset.postContent;
                if (cardContent) {
                    const cardExternalUrl = extractExternalImageUrl(cardContent);
                    if (cardExternalUrl) {
                        replaceImageSource(card, cardExternalUrl);
                    }
                }
            });

            // Update meta tags for social sharing
            updateMetaTags(externalUrl);
        }
    }

    /**
     * Update Open Graph and Twitter meta tags
     * @param {string} imageUrl - External image URL
     */
    function updateMetaTags(imageUrl) {
        if (!imageUrl) return;

        // Update or create Open Graph image meta tag
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
            ogImage = document.createElement('meta');
            ogImage.setAttribute('property', 'og:image');
            document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', imageUrl);

        // Update or create Twitter image meta tag
        let twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (!twitterImage) {
            twitterImage = document.createElement('meta');
            twitterImage.setAttribute('name', 'twitter:image');
            document.head.appendChild(twitterImage);
        }
        twitterImage.setAttribute('content', imageUrl);
    }

    /**
     * Initialize external images handler
     */
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Process based on page type
        const bodyClasses = document.body.className;

        if (bodyClasses.includes('post-template') || bodyClasses.includes('page-template')) {
            // Individual post or page
            processFullPost();
        }

        // Always process post cards (they can appear on any page)
        processPostCards();

        // Process dynamically loaded content
        observeDynamicContent();
    }

    /**
     * Observe for dynamically loaded content (infinite scroll, etc.)
     */
    function observeDynamicContent() {
        if (!window.MutationObserver) return;

        const observer = new MutationObserver(mutations => {
            let shouldProcess = false;

            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('post-card')) {
                            shouldProcess = true;
                        }
                    });
                }
            });

            if (shouldProcess) {
                setTimeout(processPostCards, 100);
            }
        });

        // Observe the main content area
        const contentArea = document.querySelector('.site-main, .posts-container');
        if (contentArea) {
            observer.observe(contentArea, {
                childList: true,
                subtree: true
            });
        }
    }

    // Initialize
    init();

    // Export for use in templates if needed
    window.ExternalImages = {
        extract: extractExternalImageUrl,
        replace: replaceImageSource,
        updateMeta: updateMetaTags
    };
})();