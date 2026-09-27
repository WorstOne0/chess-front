// Next
import Link from "next/link";
// Icons
import { MdOutlineArrowBack } from "react-icons/md";

export default function BackLink() {
  return (
    <Link href="/" className="h-[4.8rem] pl-[1.4rem] pr-[2rem] flex items-center gap-[1rem] rounded-[1.4rem] bg-surface shadow-raise text-[1.5rem] font-extrabold active:shadow-inset">
      <MdOutlineArrowBack size={20} />
      Back
    </Link>
  );
}
