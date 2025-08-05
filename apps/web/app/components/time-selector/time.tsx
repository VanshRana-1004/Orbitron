import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';

interface TimeSelectorProps {
  initialTime?: { hours: number; minutes: number; ampm: 'AM' | 'PM' };
  onChange?: (time: { hours: number; minutes: number; ampm: 'AM' | 'PM' }) => void;
  className?: string;
}

  function getCurrentTime(): { hours: number; minutes: number; ampm: 'AM' | 'PM' } {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;

    return { hours, minutes, ampm };
  }

export default function TimeSelector({ 
  initialTime = { hours: 12, minutes: 0, ampm: 'AM' }, 
  onChange,
  className = ''
}: TimeSelectorProps) {
  const [time, setTime] = useState(getCurrentTime());

  const [focusedField, setFocusedField] = useState<'hours' | 'minutes' | 'ampm' | null>(null);
  
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);

  const updateTime = (newTime: typeof time) => {
    setTime(newTime);
    onChange?.(newTime);
  };

  const incrementHours = () => {
    const newHours = time.hours === 12 ? 1 : time.hours + 1;
    updateTime({ ...time, hours: newHours });
  };

  const decrementHours = () => {
    const newHours = time.hours === 1 ? 12 : time.hours - 1;
    updateTime({ ...time, hours: newHours });
  };

  const incrementMinutes = () => {
    const newMinutes = time.minutes === 59 ? 0 : time.minutes + 1;
    updateTime({ ...time, minutes: newMinutes });
  };

  const decrementMinutes = () => {
    const newMinutes = time.minutes === 0 ? 59 : time.minutes - 1;
    updateTime({ ...time, minutes: newMinutes });
  };

  const toggleAmPm = () => {
    const newAmPm = time.ampm === 'AM' ? 'PM' : 'AM';
    updateTime({ ...time, ampm: newAmPm });
  };

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 1;
        if (value < 1) value = 1;
        if (value > 12) value = 12;

        updateTime({ ...time, hours: value });
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 0;
        if (value < 0) value = 0;
        if (value > 59) value = 0;

        updateTime({ ...time, minutes: value });
    };


  const handleHoursKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      incrementHours();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrementHours();
    }
  };

  const handleMinutesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      incrementMinutes();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrementMinutes();
    }
  };

  return (
   <div className=" flex items-center space-x-4 p-4 py-2 w-fit rounded border border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#000000] dark:bg-[linear-gradient(307.82deg,_rgba(14,22,36,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)] dark:shadow-[inset_0_0_2px_#23344C] text-[#16422E] dark:text-white">
        
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={incrementHours}
            className="p-2 rounded-full  transition-colors  text-green-900 dark:text-[#0076FC] hover:bg-[#d1ffeb] dark:hover:bg-[#1E2C40] "
          >
            <ChevronUp size={18} />
          </button>
          
          <div className="relative">
            <input
              ref={hoursRef}
              type="number"
              min="1"
              max="12"
              value={time.hours.toString().padStart(2, '0')}
              onChange={handleHoursChange}
              onKeyDown={handleHoursKeyDown}
              onFocus={() => setFocusedField('hours')}
              onBlur={() => setFocusedField(null)}
              className={`w-12 h-12 text-center text-2xl text-[#16422E] dark:text-white font-mono transition-all outline-none bg-[#e4fcf1] dark:bg-[#1E2C40] border-2 border-[#e4fcf1] dark:border-[#1E2C40] focus:border-[#16422E] focus:dark:border-[#0076FC] rounded-xl`}
            />
          </div>
          
          <button
            onClick={decrementHours}
            className="p-2 rounded-full  transition-colors  text-green-900 dark:text-[#0076FC] hover:bg-[#d1ffeb] dark:hover:bg-[#1E2C40] "
          >
            <ChevronDown size={18} />
          </button>
          
          <span className="text-xs text-green-900 dark:text-gray-200 font-medium">Hours</span>
        </div>

        <div className="flex flex-col items-center text-3xl font-bold -translate-y-4 text-green-900 dark:text-[#0076FC]">:</div>

        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={incrementMinutes}
            className="p-2 rounded-full  transition-colors duration-200 text-green-900 dark:text-[#0076FC] hover:bg-[#d1ffeb] dark:hover:bg-[#1E2C40]"
          >
            <ChevronUp size={18} />
          </button>
          
          <div className="relative">
            <input
              ref={minutesRef}
              type="number"
              min="0"
              max="59"
              value={time.minutes.toString().padStart(2, '0')}
              onChange={handleMinutesChange}
              onKeyDown={handleMinutesKeyDown}
              onFocus={() => setFocusedField('minutes')}
              onBlur={() => setFocusedField(null)}
              className={`w-12 h-12 text-center text-2xl text-[#16422E] dark:text-white font-mono transition-all duration-200 outline-none bg-[#e4fcf1] dark:bg-[#1E2C40] border-2 border-[#e4fcf1] dark:border-[#1E2C40] focus:border-[#16422E] focus:dark:border-[#0076FC] rounded-xl`}
            />
          </div>
          
          <button
            onClick={decrementMinutes}
            className="p-2 rounded-full  transition-colors duration-200 text-green-900 dark:text-[#0076FC] hover:bg-[#d1ffeb] dark:hover:bg-[#1E2C40]"
          >
            <ChevronDown size={18} />
          </button>
          
          <span className="text-xs text-green-900 dark:text-gray-200 font-medium">Minutes</span>
        </div>

        <div className="flex flex-col ml-2">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => updateTime({ ...time, ampm: 'AM' })}
              onFocus={() => setFocusedField('ampm')}
              onBlur={() => setFocusedField(null)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[3rem]
                ${time.ampm === 'AM' 
                  ? 'bg-[#16422E] dark:bg-[#0076FC] text-white font-bold shadow-md' 
                  : 'bg-[#e4fcf1] dark:bg-white text-[#1E2C40] '
                }`}
            >AM</button>
            <button
              onClick={() => updateTime({ ...time, ampm: 'PM' })}
              onFocus={() => setFocusedField('ampm')}
              onBlur={() => setFocusedField(null)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[3rem]
                ${time.ampm === 'PM' 
                  ? 'bg-[#16422E] dark:bg-[#0076FC] text-white font-bold shadow-md' 
                  : 'bg-[#e4fcf1] dark:bg-white text-[#1E2C40] '
                }`}
            >PM</button>
          </div>
        </div>
      </div>
    );
}