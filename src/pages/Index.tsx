import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FileUpload } from "@/components/FileUpload";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      {user && (
        <div id="upload-section" className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Upload Your Audio File
            </h2>
            <FileUpload />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;