# GreenHealth Lab Website Deployment Guide

## 📋 What You Have

A professional, single-page website for GreenHealth Laboratory located at:
`blood-collection-lis/website/index.html`

## 🌐 How to Deploy (3 Easy Options)

### Option 1: GitHub Pages (FREE & Recommended)

1. **Create a GitHub account** (if you don't have one)
   - Go to https://github.com/signup

2. **Create a new repository**
   - Name it: `greenhealth-website`
   - Make it Public

3. **Upload the file**
   - Click "uploading an existing file"
   - Drag and drop `index.html`
   - Commit changes

4. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main
   - Click Save

5. **Your site will be live at:**
   `https://yourusername.github.io/greenhealth-website`

### Option 2: Netlify (FREE with Custom Domain)

1. **Go to** https://www.netlify.com
2. **Sign up** (free account)
3. **Drag and drop** the `website` folder
4. **Your site is live!** (gets a random URL like `random-name.netlify.app`)
5. **Add custom domain:**
   - Buy `greenhealth.lab` from a domain registrar
   - In Netlify: Site settings → Domain management → Add custom domain
   - Follow DNS instructions

### Option 3: Vercel (FREE)

1. **Go to** https://vercel.com
2. **Sign up** with GitHub
3. **Import** your repository
4. **Deploy** - Done!

## 💰 Getting the Domain "greenhealth.lab"

### Where to Buy:
- **Namecheap**: https://www.namecheap.com (~$25/year)
- **GoDaddy**: https://www.godaddy.com (~$30/year)
- **Google Domains**: https://domains.google (~$20/year)

### Steps:
1. Search for "greenhealth.lab"
2. Add to cart
3. Complete purchase
4. Connect to your hosting (Netlify/Vercel/GitHub Pages)

## 🎨 Customization

Before deploying, you should update:

### Contact Information (in index.html):
```html
<!-- Line ~380 - Phone -->
<a href="tel:+919876543210">+91 98765 43210</a>

<!-- Line ~385 - Email -->
<a href="mailto:info@greenhealth.lab">info@greenhealth.lab</a>

<!-- Line ~390 - Address -->
<p>Your City, Your State<br>Open: Mon-Sat, 8 AM - 8 PM</p>
```

### Logo:
- Replace 🌿 emoji with your actual logo image
- Or keep the emoji for a clean, modern look

## 📱 Testing Locally

To preview before deploying:

1. **Open the file** in your browser:
   - Right-click `index.html`
   - Open with → Chrome/Edge/Firefox

2. **Or use Live Server** (if you have VS Code):
   - Install "Live Server" extension
   - Right-click `index.html` → Open with Live Server

## ✅ What's Included

- ✨ Modern, professional design
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎨 Smooth animations
- 🚀 Fast loading
- 🔍 SEO optimized
- ♿ Accessible

## 🎯 Next Steps

1. **Test locally** - Make sure everything looks good
2. **Update contact info** - Add your real details
3. **Choose deployment** - Pick GitHub Pages, Netlify, or Vercel
4. **Deploy!** - Follow the steps above
5. **Buy domain** - Get greenhealth.lab
6. **Connect domain** - Point it to your deployed site

## 💡 Tips

- Start with **GitHub Pages** (easiest, free)
- Buy the domain **after** testing the site
- Use **Netlify** if you want easy custom domain setup
- The site is a single HTML file - super simple to manage!

## 🆘 Need Help?

If you run into issues:
1. Check the hosting platform's documentation
2. Most platforms have live chat support
3. YouTube has great tutorials for each platform

---

**Your website is ready to go live!** 🎉
