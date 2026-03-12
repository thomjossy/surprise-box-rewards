import DonationBoxCard from "./DonationBoxCard";
import { DonationBox } from "@/lib/gameStore";

interface DonationBoxGridProps {
  boxes: DonationBox[];
  selectedBox: number | null;
  onSelectBox: (boxId: number) => void;
}

export default function DonationBoxGrid({ boxes, selectedBox, onSelectBox }: DonationBoxGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:gap-5">
      {boxes.map((box, i) => (
        <DonationBoxCard
          key={box.id}
          boxNumber={box.id}
          isOpened={selectedBox === box.id || box.isOpened}
          isDisabled={(selectedBox !== null && selectedBox !== box.id) || box.isOpened}
          onClick={() => onSelectBox(box.id)}
          delay={i}
        />
      ))}
    </div>
  );
}
