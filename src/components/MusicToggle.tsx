import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import { audioManager } from '@/lib/audio/AudioManager';

interface MusicToggleProps {
  className?: string;
}

export function MusicToggle({ className = '' }: MusicToggleProps) {
  const { 
    isInitialized, 
    volume, 
    ambianceEnabled,
    initAudio, 
    pauseBgMusic,
    toggleAmbiance,
  } = useAudio();
  
  const hasStartedRef = useRef(false);
  const isMusicOn = ambianceEnabled && volume > 0;

  // Start music on first user interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;
      
      try {
        await initAudio();
        // Directly call audioManager to avoid state sync issues
        if (ambianceEnabled) {
          console.log('Starting background music after init...');
          await audioManager.playBg();
          await audioManager.playAmbiance();
        }
      } catch (e) {
        console.warn('Failed to start audio:', e);
      }
      
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [initAudio, ambianceEnabled]);

  const handleToggle = async () => {
    // Ensure audio is initialized
    if (!isInitialized) {
      await initAudio();
      // Small delay to let init complete
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Check current state BEFORE toggling
    const turningOn = !ambianceEnabled;
    
    // Toggle the ambiance state
    toggleAmbiance();
    
    // Use the captured value to decide action — call audioManager directly
    if (turningOn) {
      console.log('Turning music ON');
      // Ensure not muted
      audioManager.setMuted(false);
      audioManager.setAmbianceEnabled(true);
      await audioManager.playBg();
      await audioManager.playAmbiance();
    } else {
      console.log('Turning music OFF');
      audioManager.pauseBg();
      audioManager.pauseAmbiance();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={`
        h-10 w-10 rounded-full 
        bg-primary/30 hover:bg-primary/50
        border border-accent/30 hover:border-accent/50
        transition-all duration-200
        ${isMusicOn ? 'text-accent' : 'text-muted-foreground'}
        ${className}
      `}
      title={isMusicOn ? 'Turn music OFF' : 'Turn music ON'}
    >
      {isMusicOn ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </Button>
  );
}
