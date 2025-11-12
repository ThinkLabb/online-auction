import { JSX, useState } from "react";

const CategoryDetail = {
  electronics: ["Phone", "Laptop", "Camera", "Tablet", "Smartwatch"],
  fashion: ["Shirt", "Jeans", "Shoes", "Dress", "Jacket"],
  sports: ["Football", "Tennis Racket", "Basketball", "Gym Gloves"],
  vehicles: ["Car", "Motorbike", "Bicycle", "Scooter"],
} as const;

export default function CategoryMenu(): JSX.Element {
  return (
    <ul className="flex flex-row justify-center gap-16 font-semibold mx-4"> 
      {Object.entries(CategoryDetail).map(([key, rawItems]) => { 
        const items = rawItems as readonly string[]; 
        const label = (key[0].toUpperCase() + key.slice(1)) as string; 
        return ( 
          <li key={key} className="relative group"> 
            <button 
              className="cursor-pointer focus:outline-none my-4 
                        hover:text-[#8D0000] hover:underline
                        group-hover:text-[#8D0000] group-hover:underline
                        focus:text-[#8D0000] focus:underline"
              aria-haspopup="true" 
              aria-expanded="false" 
            > 
              {label} 
            </button> 
            
            <div 
              className="absolute top-full left-0 opacity-0 pointer-events-none 
                        group-hover:opacity-100 group-hover:pointer-events-auto 
                        group-focus-within:opacity-100 group-focus-within:pointer-events-auto 
                        transform transition-all duration-150 bg-white shadow-xl z-10 min-w-40 rounded-b-md" 
              role="menu" 
            > 
              <ul className="space-y-1"> 
                {items.map((it) => ( 
                  <li key={it} role="menuitem" className="hover:text-[#8D0000] cursor-pointer hover:bg-[#FAE5E5] px-2 py-1 font-normal text-m rounded-md"> 
                    {it} 
                  </li> 
                ))} 
              </ul> 
            </div>
          </li> 
        ); 
      })} 
    </ul>
  );
}

