import { useState, useEffect, useRef } from "react";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import emailjs from "emailjs-com";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { EffectComposer, Glitch } from "@react-three/postprocessing";
import AdsComponent from './AdsComponent';
import './styles/futuristic.css';

const genAI = new GoogleGenerativeAI("xxx");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Enhanced 3D Sphere Component
function Sphere() {
  const meshRef = useRef();
  useFrame((state) => {
    meshRef.current.rotation.x += 0.005;
    meshRef.current.rotation.y += 0.005;
    meshRef.current.position.z = Math.sin(state.clock.getElapsedTime()) * 2;
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial 
        color="#00ff9d" 
        emissive="#00ff9d"
        emissiveIntensity={0.5}
        wireframe
        wireframeLinewidth={1}
      />
    </mesh>
  );
}

// Floating 3D Text
function FloatingText() {
  return (
    <Text
      color="#00ff9d"
      fontSize={1}
      maxWidth={10}
      lineHeight={1}
      letterSpacing={0.1}
      position={[0, 3, -5]}
      rotation={[0, 0, 0]}
    >
      GEN-Z SLANG
      <meshStandardMaterial emissive="#00ff9d" emissiveIntensity={1} />
    </Text>
  );
}

export default function SlangSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostSearched, setMostSearched] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMostSearched();
  }, []);

  const fetchMostSearched = async () => {
    try {
      const response = await axios.get("http://44.212.68.8:5000/api/slang");
      const sortedData = response.data.sort((a, b) => b.count - a.count);
      setMostSearched(sortedData);
    } catch (err) {
      console.error("Error fetching most searched slangs:", err);
    }
  };

  const fetchMeaningFromGemini = async (word) => {
    try {
      const prompt = `What does '${word}' mean in Gen Z slang? Respond in 50 words or less. 
      If you are confident that '${word}' is not a valid Gen Z slang term, respond with exactly: "Slang not found!"`;
      const result = await model.generateContent(prompt);
      const geminiResponse = result.response.text();

      console.log("Gemini Response:", geminiResponse);

      if (
        geminiResponse.toLowerCase().includes("doesn't mean anything") ||
        geminiResponse.toLowerCase().includes("no hidden meaning") ||
        geminiResponse.toLowerCase().includes("random string of letters") ||
        geminiResponse.toLowerCase().includes("slang not found!")
      ) {
        setDefinition("Slang not found!");
        setError("Slang not found!");
      } else {
        await axios.post("http://44.212.68.8:5000/api/slang", {
          term: word,
          meaning: geminiResponse,
        });
        await fetchMostSearched();
        setDefinition(geminiResponse);
        setError("");
      }
    } catch (err) {
      console.error("Error fetching definition from Gemini:", err);
      setDefinition("Error fetching definition. Try again later.");
    }
  };

  const handleSearch = async (term = searchTerm) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://44.212.68.8:5000/api/slang/search?term=${term}`
      );
      if (response.data) {
        setDefinition(response.data.meaning);
        setError("");
      } else {
        await fetchMeaningFromGemini(term);
      }
      await fetchMostSearched();
    } catch (err) {
      if (err.response?.status === 404) {
        await fetchMeaningFromGemini(term);
      } else {
        setDefinition("Error fetching definition. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReportSlang = async () => {
    const templateParams = {
      slang: searchTerm,
      message: `The slang '${searchTerm}' exists but is not found in the database.`,
    };

    emailjs
      .send(
        "service_fejvhex",
        "template_ha3th1d",
        templateParams,
        "C_jEsdHAAE4hn_TLP"
      )
      .then(() => alert("Report sent successfully!"))
      .catch(() => alert("Failed to send report."));
  };

  const handleReportIncorrectMeaning = async () => {
    const templateParams = {
      slang: searchTerm,
      message: `The slang '${searchTerm}' exists, but the meaning is incorrect.`,
    };

    emailjs
      .send(
        "service_fejvhex",
        "template_ha3th1d",
        templateParams,
        "C_jEsdHAAE4hn_TLP"
      )
      .then(() => alert("Report sent successfully!"))
      .catch(() => alert("Failed to send report."));
  };


  return (
    <div className="min-h-screen bg-transparent text-white flex justify-center items-center p-4 relative overflow-hidden">
      {/* Enhanced 3D Background */}
      <div className="canvas-container">
        <Canvas>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00ff9d" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00e4" />
          
          <Sphere />
          <FloatingText />
          <Stars radius={100} depth={50} count={2000} factor={6} saturation={0} fade speed={2} />
          
          <EffectComposer>
            <Glitch
              delay={[1.5, 3.5]}
              duration={[0.6, 1.0]}
              strength={[0.1, 0.3]}
              active
            />
          </EffectComposer>
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Main Content */}
      <div className="center-container">
        <div className="content-wrapper">
        {/* Header with animation */}
        <motion.h1 className="text-4xl md:text-5xl font-bold mb-8 neon-text">
          GenZ Slang Finder
        </motion.h1>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="glass-card p-6 w-full">
            <div className="input-group">
            <Input
              placeholder="Search for a slang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full futuristic-input mb-6"
            />
            <Button
              onClick={() => handleSearch()}
              className="w-full glow-button py-6 text-lg"
              disabled={loading}
            >
              {loading ? (
                <Loader className="animate-spin" />
              ) : (
                <span className="text-shadow">SEARCH</span>
              )}
            </Button>
            </div>
  
            {definition && (
              
              <motion.div 
                className="mt-6 p-4 bg-black bg-opacity-50 rounded-lg border border-primary border-opacity-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-lg font-mono text-gray-200">{definition}</p>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Ad Space */}
        <motion.div
          className="mt-10 glass-card p-6 ad-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-bold mb-4 text-center text-gray-300">Sponsored</h2>
          <div className="glass-card mt-6 w-full p-4">

          <AdsComponent dataAdSlot='8409160404' />
          </div>

        </motion.div>

        {/* Most Searched Slangs - Add this section if needed */}
        {mostSearched.length > 0 && (
                      <div className="glass-card mt-6 w-full p-4">

          <motion.div 
            className="mt-10 glass-card p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-center neon-text">Trending Slangs</h2>
            <div className="grid grid-cols-2 gap-3 responsive-grid">
              {mostSearched.slice(0, showMore ? mostSearched.length : 6).map(({ term, count }, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="w-full bg-black bg-opacity-50 hover:bg-opacity-70 border border-primary border-opacity-30"
                    onClick={() => {
                      setSearchTerm(term);
                      handleSearch(term);
                    }}
                  >
                    <span className="text-primary">{term}</span>
                    <span className="ml-2 text-gray-400">({count})</span>
                  </Button>
                </motion.div>
              ))}
            </div>
            {mostSearched.length > 6 && (
              <Button
                onClick={() => setShowMore(!showMore)}
                className="mt-4 w-full glow-button py-4"
              >
                {showMore ? "SHOW LESS" : "LOAD MORE"}
              </Button>
            )}
          </motion.div>
          </div>

        )}
        </div>
      </div>
    </div>
  );
}