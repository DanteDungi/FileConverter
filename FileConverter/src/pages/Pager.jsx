import Header from "../components/Header.jsx";
import Banners from "../components/Banners.tsx";
// import logo from "../assets/logo.svg";
// import bricks from "../assets/brick_wall.jpg"
//bg-blue-900

export default function Pager(){
    return (
        <div className="flex items-center justify-start flex-col bg-[#FB9E3A]">
            <Header title="Our Offerings" className="justify-center"/>
            <div className="flex justify-center">
                <img src="images/folders.png" className="size-50 mb-15"></img>
            </div>
            <Banners/>
        </div>
    );
}
