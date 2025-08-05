import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

export default function DatePicker({ selected, onSelect, className = '' }: DatePickerProps) {
  return (
    <div className={`inline-block ${className}`}>
      <style jsx>{`
        .custom-daypicker .rdp-nav_button svg {
          fill: #16422E;
        }
        .dark .custom-daypicker .rdp-nav_button svg {
          fill: #0076FC;
        }
        .custom-daypicker .rdp-nav_button:hover svg {
          fill: #0d2818;
        }
        .dark .custom-daypicker .rdp-nav_button:hover svg {
          fill: #0066e6;
        }
      `}</style>
      
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        modifiersClassNames={{
          selected:'rounded-xl !text-white !bg-[#16422E] dark:!bg-[#0076FC] font-semibold',
          today:'rounded-xl text-green-600 dark:text-[#0076FC] bg-[#e4fcf1] dark:bg-[#1E2C40] font-bold',
        }}
        className={`custom-daypicker text-sm w-fit text-[#16422E] dark:text-white border border-[#7AF8C1] dark:border-[#1E2C40] bg-white backdrop-blur-[15.81px] rounded p-3 dark:bg-[#000000] dark:bg-[linear-gradient(307.82deg,_rgba(14,22,36,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)] dark:shadow-[inset_0_0_2px_#23344C]`}
        classNames={{
          caption: 'flex justify-between items-center font-semibold text-gray-700 dark:text-gray-200 mb-2',
          nav_button: 'w-7 h-7 text-[#16422E] dark:text-[#0076FC] hover:bg-[#e4fcf1] dark:hover:bg-[#1E2C40] rounded transition-colors duration-200 flex items-center justify-center',
          nav_button_previous: 'text-[#16422E] dark:text-[#0076FC]',
          nav_button_next: 'text-[#16422E] dark:text-[#0076FC]',
          table: 'w-full border-collapse',
          head_row: 'flex justify-between mb-1',
          head_cell: 'w-8 text-center text-xs text-gray-400 dark:text-gray-500',
          row: 'flex justify-between',
          cell: 'w-8 h-8 text-center rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition',
          day_selected: 'bg-violet-200 text-green-500 dark:bg-violet-600 dark:text-white font-medium',
          day_today: 'text-green-600 dark:text-blue-400 font-semibold',
          day_outside: 'text-gray-300 dark:text-zinc-600',
        }}
        styles={{
          nav_button: {
            color: 'var(--nav-button-color)',
          }
        }}
      />
    </div>
  );
}