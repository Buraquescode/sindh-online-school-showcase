'use client';
import { useParams } from 'next/navigation';
import YouTube from 'react-youtube';

export default function LecturePage() {
  const { id } = useParams();

  const opts = {
    height: '390',
    width: '100%',
    playerVars: {
      autoplay: 1,
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="aspect-video">
          <YouTube videoId={id as string} opts={opts} className="w-full h-full" />
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Video Lecture</h1>
          <p className="text-gray-600 mt-2">Video ID: {id}</p>
        </div>
      </div>
    </div>
  );
}