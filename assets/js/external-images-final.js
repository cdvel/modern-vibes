/**
 * External Images Handler for Ghost Theme - Final Version
 * Works by detecting image URLs in the excerpt text
 */

(function() {
    'use strict';

    /**
     * Check if a string is a valid image URL
     */
    function isImageUrl(str) {
        if (!str) return false;

        try {
            const url = new URL(str.trim());
            // Check if URL ends with common image extensions or contains known image services
            return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname) ||
                   url.hostname.includes('media-amazon.com') ||
                   url.hostname.includes('goodreads.com') ||
                   url.hostname.includes('imgur.com') ||
                   url.hostname.includes('cloudinary.com');
        } catch (e) {
            return false;
        }
    }

    /**
     * Fix broken URLs (Ghost sometimes breaks URLs with spaces/newlines)
     */
    function fixBrokenUrl(text) {
        if (!text) return null;

        // Look for patterns that suggest a broken URL
        // Match URLs that might be broken across lines or have spaces inserted
        const brokenUrlPattern = /https?:\/\/[^\s]*\s+[^\s<>"{}|\\^`\[\]]+\.(jpg|jpeg|png|gif|webp|svg)/gi;
        const match = text.match(brokenUrlPattern);

        if (match) {
            // Remove all whitespace from the URL
            const fixedUrl = match[0].replace(/\s+/g, '');
            return fixedUrl;
        }

        // Also try to find URLs that start with common image hosts
        const amazonPattern = /https?:\/\/[^\s]*media[^\s]*amazon[^\s<>"{}|\\^`\[\]]+/gi;
        const amazonMatch = text.match(amazonPattern);

        if (amazonMatch) {
            // Remove spaces and reconstruct
            const fullText = text.substring(text.indexOf(amazonMatch[0]));
            const reconstructed = fullText.split(/\s+/).join('');

            // Extract just the URL part
            const urlMatch = reconstructed.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(jpg|jpeg|png|gif|webp|svg)/i);
            if (urlMatch) {
                return urlMatch[0];
            }
        }

        return null;
    }

    /**
     * Extract image URL from text content
     */
    function extractImageFromText(text) {
        if (!text) return null;

        // First try to fix any broken URLs
        const fixedUrl = fixBrokenUrl(text);
        if (fixedUrl && isImageUrl(fixedUrl)) {
            return fixedUrl;
        }

        // Look for complete URLs in the text
        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
        const urls = text.match(urlRegex);

        if (urls) {
            // Find the first valid image URL
            for (const url of urls) {
                const cleanUrl = url.trim().replace(/[,;!?\s]+$/, ''); // Remove trailing punctuation
                if (isImageUrl(cleanUrl)) {
                    return cleanUrl;
                }
            }
        }

        // Special handling for Goodreads/Amazon URLs that might be mangled
        // Try to extract the image ID and reconstruct the URL
        const goodreadsPattern = /(\d{7,})\.jpg/;
        const goodreadsMatch = text.match(goodreadsPattern);

        if (goodreadsMatch && text.includes('goodreads')) {
            const reconstructedUrl = `https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/${goodreadsMatch[0]}`;
            if (isImageUrl(reconstructedUrl)) {
                return reconstructedUrl;
            }
        }

        return null;
    }

    /**
     * Replace image source with external URL
     */
    function replaceImageSource(element, externalUrl) {
        if (!element || !externalUrl) return;

        let img = element.tagName === 'IMG' ? element : element.querySelector('img');

        if (!img) {
            // No image exists - check if there's a placeholder
            const placeholder = element.querySelector('.post-image-placeholder');

            if (placeholder) {
                // Replace the placeholder with an actual image
                const newImg = document.createElement('img');
                newImg.src = externalUrl;
                newImg.alt = placeholder.getAttribute('title') || 'Post image';
                newImg.loading = 'lazy';
                newImg.className = 'post-feature-image';

                placeholder.parentNode.replaceChild(newImg, placeholder);
                img = newImg;
            } else {
                // Create a new image inside the container
                const link = element.querySelector('a');
                if (link) {
                    const newImg = document.createElement('img');
                    newImg.src = externalUrl;
                    newImg.alt = 'Post image';
                    newImg.loading = 'lazy';
                    newImg.className = 'post-feature-image';

                    link.innerHTML = '';
                    link.appendChild(newImg);
                    img = newImg;
                }
            }
        }

        if (img) {
            // Store original source as fallback (if updating existing image)
            if (!img.dataset.originalSrc && img.src && img.src !== externalUrl) {
                img.dataset.originalSrc = img.src;
            }

            img.src = externalUrl;

            // Handle load errors
            img.onerror = function() {
                if (this.dataset.originalSrc && this.src !== this.dataset.originalSrc) {
                    this.src = this.dataset.originalSrc;
                } else {
                    // If no original, revert to placeholder
                    const placeholder = document.createElement('div');
                    placeholder.className = 'post-image-placeholder';
                    placeholder.title = this.alt || 'Post image';
                    this.parentNode.replaceChild(placeholder, this);
                }
            };
        }
    }

    /**
     * Process post cards on listing pages
     */
    function processPostCards() {
        const postCards = document.querySelectorAll('.post-card');

        postCards.forEach((card) => {
            // Get the excerpt text
            const excerptElement = card.querySelector('.post-excerpt');
            if (!excerptElement) return;

            const excerptText = excerptElement.textContent;
            const imageUrl = extractImageFromText(excerptText);

            if (imageUrl) {
                // Replace the image
                const imageContainer = card.querySelector('.post-image');
                if (imageContainer) {
                    replaceImageSource(imageContainer, imageUrl);
                }

                // Hide the URL from the excerpt if it's visible
                const excerptP = excerptElement.querySelector('p');
                if (excerptP) {
                    // Try to remove the URL parts from the text
                    let newText = excerptP.textContent;

                    // Remove the complete URL (including any broken parts)
                    // First, remove the exact URL we found
                    newText = newText.replace(imageUrl, '');

                    // Also remove any partial URL fragments that might remain
                    // Remove anything that looks like a URL
                    newText = newText.replace(/https?:\/\/[^\s]*/g, ''); // Remove URL starts

                    // Remove domain fragments
                    newText = newText.replace(/m\.media-amazon\.com[^\s]*/g, '');
                    newText = newText.replace(/media-amazon[^\s]*/g, '');
                    newText = newText.replace(/compressed\.photo\.goodreads[^\s]*/g, '');
                    newText = newText.replace(/goodreads\.com[^\s]*/g, '');

                    // Remove image file paths and extensions
                    newText = newText.replace(/\/books\/[^\s]*/g, '');
                    newText = newText.replace(/\d{7,}\.(jpg|jpeg|png|gif|webp|svg)/gi, '');
                    newText = newText.replace(/\.(jpg|jpeg|png|gif|webp|svg)/gi, '');

                    // Remove any leftover URL-like fragments
                    newText = newText.replace(/[\/\.][^\s]*\.(jpg|jpeg|png|gif|webp|svg)/gi, '');
                    newText = newText.replace(/compressed\.\s*photo/gi, '');

                    // Clean up multiple spaces and trim
                    newText = newText.replace(/\s+/g, ' ').trim();

                    // If we removed everything or left with very little text
                    if (newText.length < 10) {
                        // Try to get the next bit of content from the post
                        const fullText = excerptElement.textContent;
                        const urlIndex = fullText.indexOf('http');
                        if (urlIndex > 0) {
                            // There might be text before the URL
                            newText = fullText.substring(0, urlIndex).trim();
                        }

                        // If still too short, use a default message
                        if (newText.length < 10) {
                            newText = 'Click to read more...';
                        }
                    }

                    excerptP.textContent = newText;
                }
            }
        });
    }

    /**
     * Process individual post/page
     */
    function processFullPost() {
        // Look for the URL in the post content
        const postContent = document.querySelector('.post-content, .page-content');
        if (!postContent) return;

        // Get the first paragraph or any element that might contain the URL
        const firstElements = postContent.querySelectorAll('p, div');
        let imageUrl = null;

        for (const elem of firstElements) {
            imageUrl = extractImageFromText(elem.textContent);
            if (imageUrl) {
                // Hide this element if it only contains URL fragments
                const text = elem.textContent.trim();
                if (text.includes('http') && text.length < 200) {
                    elem.style.display = 'none';
                }
                break;
            }
        }

        if (imageUrl) {
            // Update featured image
            const featuredImage = document.querySelector('.post-full-image img, .page-image img');
            if (featuredImage) {
                replaceImageSource(featuredImage, imageUrl);
            }

            // Update meta tags
            updateMetaTags(imageUrl);
        }
    }

    /**
     * Update Open Graph and Twitter meta tags
     */
    function updateMetaTags(imageUrl) {
        if (!imageUrl) return;

        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
            ogImage = document.createElement('meta');
            ogImage.setAttribute('property', 'og:image');
            document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', imageUrl);

        let twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (!twitterImage) {
            twitterImage = document.createElement('meta');
            twitterImage.setAttribute('name', 'twitter:image');
            document.head.appendChild(twitterImage);
        }
        twitterImage.setAttribute('content', imageUrl);
    }

    /**
     * Initialize
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        const bodyClasses = document.body.className;

        if (bodyClasses.includes('post-template') || bodyClasses.includes('page-template')) {
            processFullPost();
        }

        // Always process post cards (they can appear on any page)
        processPostCards();

        // Observe for dynamic content
        if (window.MutationObserver) {
            const observer = new MutationObserver(() => {
                setTimeout(processPostCards, 100);
            });

            const contentArea = document.querySelector('.site-main, .posts-container');
            if (contentArea) {
                observer.observe(contentArea, {
                    childList: true,
                    subtree: true
                });
            }
        }
    }

    // Initialize
    init();

    // Export for testing
    window.ExternalImages = {
        extract: extractImageFromText,
        fixUrl: fixBrokenUrl,
        replace: replaceImageSource,
        processCards: processPostCards,
        processPost: processFullPost
    };
})();