import { useEffect, useRef } from "react";

function AdBanner() {
  const adInitialized = useRef(false); // Track if the ad has been initialized

  useEffect(() => {
    if (adInitialized.current) return; // Skip if already initialized

    // Load the Google AdSense script
    const script = document.createElement("script");
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1769160871110575";
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    // Initialize the ad
    script.onload = () => {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adInitialized.current = true; // Mark as initialized
    };

    // Cleanup
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full h-40 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-1769160871110575"
        data-ad-slot="8409160404"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}

export default AdBanner;
