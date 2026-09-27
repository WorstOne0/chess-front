// Next
import Image from "next/image";
import Link from "next/link";
// Assets
import logo from "@/../public/logo/icon.png";

const SIZES = {
  md: "h-[4.8rem] w-[4.8rem] rounded-[1.4rem]",
  lg: "h-[5.6rem] w-[5.6rem] rounded-[1.8rem]",
};

export default function LogoTile({ size = "md" }: { size?: keyof typeof SIZES }) {
  return (
    <Link href="/" aria-label="Chess home" className={`shrink-0 flex items-center justify-center bg-tile shadow-tile ${SIZES[size]}`}>
      <Image src={logo} alt="" priority className="h-[82%] w-[82%]" />
    </Link>
  );
}
