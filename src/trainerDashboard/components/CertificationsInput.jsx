import { useState, useEffect } from "react";
import { Award } from "lucide-react";

export default function CertificationsInput({ isEditing, onChange, value }) {
  const [certificationText, setCertificationText] = useState("");

  // Initialize from value prop (from user_metadata)
  useEffect(() => {
    if (value) {
      setCertificationText(value);
    }
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setCertificationText(newValue);
    onChange(newValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#336b6e] mb-2">
        Certifications
      </label>
      <p className="text-xs text-gray-600 mb-3">
        List your certifications (e.g., NASM-CPT, ACE, ACSM, RYT-200)
      </p>

      {isEditing ? (
        <textarea
          name="certifications"
          value={certificationText}
          onChange={handleChange}
          rows={4}
          placeholder="Enter your certifications, separated by commas or new lines"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all resize-vertical"
        />
      ) : (
        <div className="space-y-2">
          {certificationText ? (
            <div className="flex flex-wrap gap-2">
              {certificationText.split(/[,\n]/).filter(cert => cert.trim()).map((cert, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  <Award className="w-3 h-3" />
                  {cert.trim()}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No certifications listed</p>
          )}
        </div>
      )}
    </div>
  );
}
