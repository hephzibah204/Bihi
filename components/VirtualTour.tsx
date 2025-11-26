import React, { useState, useEffect } from 'react';
import { SchoolInfo } from '../types/school';
import Modal from './Modal';

interface VirtualTourProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
}

interface TourStop {
  id: string;
  title: string;
  description: string;
  image: string;
  video?: string;
  panorama?: string;
  hotspots?: {
    x: number;
    y: number;
    title: string;
    description: string;
    nextStop?: string;
  }[];
  audio?: string;
}

const VirtualTour: React.FC<VirtualTourProps> = ({ isOpen, onClose, schoolInfo }) => {
  const [currentStop, setCurrentStop] = useState(0);
  const [tourStops, setTourStops] = useState<TourStop[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [tourMode, setTourMode] = useState<'guided' | 'self'>('guided');

  useEffect(() => {
    loadTourStops();
  }, [schoolInfo]);

  const loadTourStops = () => {
    // Demo tour stops - in a real app, these would come from the database
    const stops: TourStop[] = [
      {
        id: 'entrance',
        title: 'School Entrance',
        description: 'Welcome to our beautiful campus! Our main entrance showcases our commitment to creating a welcoming environment for all students and visitors.',
        image: '/demo/tour/entrance.jpg',
        video: '/demo/tour/entrance-video.mp4',
        hotspots: [
          { x: 30, y: 60, title: 'Security Gate', description: 'Our 24/7 security ensures student safety' },
          { x: 70, y: 40, title: 'Reception Area', description: 'Visitor check-in and information center', nextStop: 'reception' }
        ],
        audio: '/demo/tour/entrance-audio.mp3'
      },
      {
        id: 'reception',
        title: 'Reception & Admin Block',
        description: 'Our modern reception area and administrative offices where parents and visitors are warmly welcomed.',
        image: '/demo/tour/reception.jpg',
        hotspots: [
          { x: 50, y: 30, title: 'Principal\'s Office', description: 'Meet our educational leadership team' },
          { x: 20, y: 70, title: 'Admissions Office', description: 'Start your admission journey here', nextStop: 'classrooms' }
        ]
      },
      {
        id: 'classrooms',
        title: 'Modern Classrooms',
        description: 'State-of-the-art classrooms equipped with smart boards, air conditioning, and comfortable seating for optimal learning.',
        image: '/demo/tour/classroom.jpg',
        video: '/demo/tour/classroom-video.mp4',
        hotspots: [
          { x: 40, y: 20, title: 'Smart Board', description: 'Interactive learning technology' },
          { x: 60, y: 80, title: 'Student Desks', description: 'Ergonomic furniture for comfort', nextStop: 'library' }
        ]
      },
      {
        id: 'library',
        title: 'Library & Media Center',
        description: 'Our extensive library houses thousands of books, digital resources, and quiet study areas for research and reading.',
        image: '/demo/tour/library.jpg',
        hotspots: [
          { x: 25, y: 50, title: 'Book Collection', description: 'Over 10,000 books across all subjects' },
          { x: 75, y: 30, title: 'Computer Section', description: 'Digital research and learning resources', nextStop: 'laboratory' }
        ]
      },
      {
        id: 'laboratory',
        title: 'Science Laboratories',
        description: 'Fully equipped science labs for Physics, Chemistry, and Biology with modern equipment and safety features.',
        image: '/demo/tour/laboratory.jpg',
        video: '/demo/tour/lab-video.mp4',
        hotspots: [
          { x: 30, y: 40, title: 'Lab Equipment', description: 'Modern scientific instruments' },
          { x: 70, y: 60, title: 'Safety Station', description: 'Emergency equipment and protocols', nextStop: 'playground' }
        ]
      },
      {
        id: 'playground',
        title: 'Sports & Recreation',
        description: 'Our expansive sports facilities include a football field, basketball court, and playground equipment for physical development.',
        image: '/demo/tour/playground.jpg',
        hotspots: [
          { x: 40, y: 30, title: 'Football Field', description: 'Full-size football pitch with grass' },
          { x: 80, y: 70, title: 'Basketball Court', description: 'Professional basketball court', nextStop: 'cafeteria' }
        ]
      },
      {
        id: 'cafeteria',
        title: 'Cafeteria & Dining',
        description: 'Our spacious cafeteria serves nutritious meals prepared by qualified nutritionists in a clean, modern kitchen.',
        image: '/demo/tour/cafeteria.jpg',
        hotspots: [
          { x: 50, y: 40, title: 'Dining Area', description: 'Comfortable seating for 200+ students' },
          { x: 20, y: 20, title: 'Kitchen', description: 'Modern kitchen with health standards' }
        ]
      }
    ];

    setTourStops(stops);
  };

  const nextStop = () => {
    if (currentStop < tourStops.length - 1) {
      setCurrentStop(currentStop + 1);
    }
  };

  const prevStop = () => {
    if (currentStop > 0) {
      setCurrentStop(currentStop - 1);
    }
  };

  const goToStop = (index: number) => {
    setCurrentStop(index);
  };

  const handleHotspotClick = (hotspot: any) => {
    if (hotspot.nextStop) {
      const nextIndex = tourStops.findIndex(stop => stop.id === hotspot.nextStop);
      if (nextIndex !== -1) {
        setCurrentStop(nextIndex);
      }
    }
  };

  const startGuidedTour = () => {
    setTourMode('guided');
    setCurrentStop(0);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (tourStops.length === 0) {
    return null;
  }

  const currentTourStop = tourStops[currentStop];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Virtual Tour - ${schoolInfo.name}`} size="full">
      <div className="h-full flex flex-col">
        {/* Tour Controls */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">{currentTourStop.title}</h2>
            <div className="text-sm text-gray-300">
              Stop {currentStop + 1} of {tourStops.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Tour Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTourMode('guided')}
                className={`px-3 py-1 rounded text-sm ${
                  tourMode === 'guided' ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                Guided
              </button>
              <button
                onClick={() => setTourMode('self')}
                className={`px-3 py-1 rounded text-sm ${
                  tourMode === 'self' ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                Self-Guided
              </button>
            </div>

            {/* Playback Controls */}
            {tourMode === 'guided' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlayPause}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <span>{isPlaying ? '⏸️' : '▶️'}</span>
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={prevStop}
                disabled={currentStop === 0}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded-lg"
              >
                ← Previous
              </button>
              <button
                onClick={nextStop}
                disabled={currentStop === tourStops.length - 1}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded-lg"
              >
                Next →
              </button>
            </div>

            {/* Settings */}
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`px-3 py-2 rounded-lg ${
                showHotspots ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {showHotspots ? '🔍 Hide Hotspots' : '🔍 Show Hotspots'}
            </button>
          </div>
        </div>

        {/* Main Tour Content */}
        <div className="flex-1 flex">
          {/* Tour View */}
          <div className="flex-1 relative bg-black">
            {/* Main Image/Video */}
            <div className="relative w-full h-full">
              {currentTourStop.video && isPlaying ? (
                <video
                  src={currentTourStop.video}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  onEnded={() => setIsPlaying(false)}
                />
              ) : (
                <img
                  src={currentTourStop.image}
                  alt={currentTourStop.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Hotspots */}
              {showHotspots && currentTourStop.hotspots && (
                <>
                  {currentTourStop.hotspots.map((hotspot, index) => (
                    <div
                      key={index}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                      onClick={() => handleHotspotClick(hotspot)}
                    >
                      {/* Hotspot Indicator */}
                      <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-white shadow-lg animate-pulse group-hover:animate-none group-hover:scale-110 transition-transform">
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                      </div>
                      
                      {/* Hotspot Tooltip */}
                      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white p-3 rounded-lg min-w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="font-semibold text-sm">{hotspot.title}</div>
                        <div className="text-xs text-gray-300 mt-1">{hotspot.description}</div>
                        {hotspot.nextStop && (
                          <div className="text-xs text-yellow-400 mt-1">Click to continue tour</div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Loading Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-4">🏫</div>
                  <div className="text-lg">Virtual Tour Demo</div>
                  <div className="text-sm text-gray-300 mt-2">
                    Interactive hotspots and navigation available
                  </div>
                </div>
              </div>
            </div>

            {/* Tour Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStop + 1) / tourStops.length) * 100}%` }}
                  ></div>
                </div>
                <div className="text-white text-sm">
                  {currentStop + 1} / {tourStops.length}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Current Stop Info */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold mb-2">{currentTourStop.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {currentTourStop.description}
              </p>
              
              {/* Audio Controls */}
              {currentTourStop.audio && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Audio Guide</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      🔊 Play
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tour Navigation */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Tour Stops</h4>
                <div className="space-y-2">
                  {tourStops.map((stop, index) => (
                    <button
                      key={stop.id}
                      onClick={() => goToStop(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        index === currentStop
                          ? 'bg-blue-100 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === currentStop
                            ? 'bg-blue-600 text-white'
                            : index < currentStop
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index < currentStop ? '✓' : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{stop.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {stop.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <button
                onClick={startGuidedTour}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <span>🎬</span>
                <span>Start Guided Tour</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">
                  📱 Mobile View
                </button>
                <button className="bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">
                  🔗 Share Tour
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Exit Virtual Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VirtualTour;
