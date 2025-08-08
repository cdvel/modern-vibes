# Modern Personal Theme

A clean, sleek, and modern Ghost theme designed for personal sites and blogs.

## Features

- **Clean, Modern Design**: Minimalist aesthetic with focus on readability
- **Typography**: Uses Alata for headings and Inter for body text
- **Responsive Layout**: Fully responsive design that works on all devices
- **Grid/List Toggle**: Switch between grid and list view for blog posts
- **Lazy Loading**: Loads 9 posts initially with "Load More" functionality
- **Native Ghost Features**: Integrated subscribe forms and membership support
- **SEO Optimized**: Proper meta tags and structured data
- **Social Integration**: Social media links and sharing
- **Contact Form**: Built-in contact form for the contact page
- **"Now" Page Support**: Special styling for "now" pages

## Installation

1. Download the theme files
2. Zip the theme folder
3. Upload to your Ghost admin panel under Design > Upload a theme
4. Activate the theme

## Setup

### Navigation
The theme includes navigation for:
- Blog (home page)
- About
- Now
- Contact

Create these pages in your Ghost admin to match the navigation.

### Fonts
The theme uses Google Fonts:
- **Alata** for headings
- **Inter** for body text

These are loaded automatically from Google Fonts CDN.

### Customization

#### Colors
You can customize colors by editing the CSS variables in `assets/css/style.css`:

```css
:root {
  --color-primary: #000000;
  --color-accent: #3b82f6;
  /* ... other variables */
}
```

#### Posts Per Page
Configure in `package.json`:

```json
{
  "config": {
    "posts_per_page": 9
  }
}
```

#### Social Links
The theme includes social icons for:
- X (Twitter) - Configured via Ghost admin
- Facebook - Configured via Ghost admin  
- GitHub
- Hugging Face
- Instagram
- Stack Overflow
- LinkedIn
- RSS Feed - Automatic

To configure the additional social links, add the following code to your Ghost site's "Code Injection" footer:

```html
<script>
document.addEventListener('DOMContentLoaded', function() {
    if (window.socialLinksManager) {
        window.socialLinksManager.setSocialUrls({
            github: 'https://github.com/yourusername',
            huggingface: 'https://huggingface.co/yourusername',
            instagram: 'https://instagram.com/yourusername',
            stackoverflow: 'https://stackoverflow.com/users/youruser',
            linkedin: 'https://linkedin.com/in/yourusername'
        });
    }
});
</script>
```

Links without URLs will be automatically hidden.

## Theme Structure

```
modern-personal-theme/
├── package.json          # Theme configuration
├── default.hbs          # Main layout template
├── index.hbs            # Home page template
├── post.hbs             # Individual post template
├── page.hbs             # Static page template
├── author.hbs           # Author page template
├── tag.hbs              # Tag page template
├── partials/
│   └── post-card.hbs    # Reusable post card component
└── assets/
    ├── css/
    │   └── style.css    # Main stylesheet
    └── js/
        └── main.js      # JavaScript functionality
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Chrome Mobile

## Development

To customize this theme:

1. Edit the Handlebars templates (.hbs files)
2. Modify styles in `assets/css/style.css`
3. Update JavaScript in `assets/js/main.js`
4. Test using Ghost CLI: `ghost start`

## Ghost Version Compatibility

This theme is compatible with Ghost 5.0+ and follows the latest Ghost theme specifications.

## License

MIT License - feel free to use this theme for personal or commercial projects.

## Support

For issues or questions about this theme, please check the Ghost theme documentation or create an issue in the theme repository.