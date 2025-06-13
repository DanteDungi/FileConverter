import Header from "../components/Header.jsx";
import Banners from "../components/Banners.tsx";
// import logo from "../assets/logo.svg";
// import bricks from "../assets/brick_wall.jpg"

export default function Pager(){
    return (
        <div className="bg-[url(images//alternative_wall.jpeg))] bg-no-repeat bg-center bg-cover h-screen w-screen">
            <Header title="Our Offerings" className=""/>
            <div className="flex justify-center">
                <img src="images/logo.svg" className="size-50 "></img>
            </div>
            <Banners/>
        </div>
    );
}
