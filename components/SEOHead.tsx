import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SchoolInfo } from '../types/school';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  schoolInfo?: SchoolInfo;
  type?: 'website' | 'article';
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  schoolInfo,
  type = 'website'
}) => {
  const siteTitle = schoolInfo ? `${schoolInfo.name} - ${schoolInfo.motto}` : 'ReportSheet - School Management System';
  const pageTitle = title ? `${title} | ${schoolInfo?.name || 'ReportSheet'}` : siteTitle;
  const metaDescription = description || schoolInfo?.description || 'Modern school management system with AI-powered features for academic excellence.';
  const metaKeywords = [
    ...(schoolInfo ? [schoolInfo.name, 'school', 'education', 'admission'] : []),
    'school management',
    'education technology',
    'student portal',
    'academic excellence',
    ...keywords
  ].join(', ');
  
  const metaImage = image || '/images/og-default.jpg';
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={schoolInfo?.name || 'ReportSheet'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={schoolInfo?.name || 'ReportSheet'} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Additional Meta Tags for Schools */}
      {schoolInfo && (
        <>
          <meta name="geo.region" content="NG" />
          <meta name="geo.placename" content={schoolInfo.address} />
          <meta name="contact" content={schoolInfo.email} />
          <meta name="phone" content={schoolInfo.phone} />
          
          {/* Schema.org structured data */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": schoolInfo.name,
              "description": schoolInfo.description,
              "url": schoolInfo.website || canonicalUrl,
              "logo": schoolInfo.logo,
              "image": metaImage,
              "telephone": schoolInfo.phone,
              "email": schoolInfo.email,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": schoolInfo.address,
                "addressCountry": "NG"
              },
              "foundingDate": schoolInfo.established,
              "sameAs": Object.values(schoolInfo.socialMedia || {}).filter(Boolean)
            })}
          </script>
        </>
      )}

      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Viewport and Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    </Helmet>
  );
};

export default SEOHead;
