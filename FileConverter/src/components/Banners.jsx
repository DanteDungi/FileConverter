import { Button } from "@/components/ui/button";
import "../index.css";

const categories = [
    {
        color: "bg-yellow-300",
        title: "Images"
    },
    {
        color: "bg-orange-500",
        title: "Documents"
    },
    {
        color: "bg-red-600",
        title: "Videos & Sound"
    },
];

function Banner({ color, title }) {
    return (
        <div className="flex flex-col items-center justify-start">
            <img
                src="images/pin.png"
                className="h-20 w-15 z-10 -mb-8 -ml-8"
            />
            <div
                className={`w-full h-[64%] rounded-xl flex justify-center underline underline-offset-8 decoration-2 ${color}`}
            >
                <h1 className="text-2xl my-12 font-bold">
                    { title }
                </h1>
            </div>
        </div>
    );
}

// underline underline-offset-8
export default function Banners() {
    return (
        <div className="grid grid-cols-3 mx-2 gap-2 min-h-screen">
            {categories.map((category) => 
                <Banner color={category.color} title={category.title} />
            )}
        </div>
    );
}
