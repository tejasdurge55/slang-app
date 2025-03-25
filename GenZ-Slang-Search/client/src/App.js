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
import { OrbitControls, Stars } from "@react-three/drei";
import AdsComponent from './AdsComponent';


const genAI = new GoogleGenerativeAI("xxx");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 3D Sphere Component
function Sphere() {
  const meshRef = useRef();
  useFrame(() => {
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.01;
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#00ff00" wireframe />
    </mesh>
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
      const response = await axios.get("http://localhost:5000/api/slang");
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
        await axios.post("http://localhost:5000/api/slang", {
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
        `http://localhost:5000/api/slang/search?term=${term}`
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
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-5 relative">
      <div className="absolute inset-0 z-0">
        <Canvas>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Sphere />
          <Stars radius={100} depth={50} count={5000} factor={4} />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <h1 className="text-5xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 neon-text">
          GenZ Slang Finder
        </h1>

        <Card className="w-full p-6 bg-gray-900 bg-opacity-75 backdrop-blur-md rounded-xl shadow-2xl">
          <Input
            placeholder="Search for a slang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-white bg-gray-800 border-gray-700 mb-4"
          />
          <Button
            onClick={() => handleSearch()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={loading}
          >
            {loading ? <Loader className="animate-spin" /> : "Search"}
          </Button>
        </Card>

        {/* Ad Space */}
        <div className="mt-8 p-6 bg-gray-900 bg-opacity-75 backdrop-blur-md rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-white">Sponsored Ad</h2>
          <AdsComponent dataAdSlot='8409160404' />

          {/* <AdSense.Google
            client='ca-pub-1769160871110575'
            slot='8409160404'
            style={{ display: 'block' }}
            format='auto'
            responsive='true'
          /> */}
        </div>
      </div>
    </div>
  );
}
