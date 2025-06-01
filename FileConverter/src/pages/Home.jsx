import Header from "../components/Header.jsx";
import Bugs from "../components/Bugs.jsx";

export default function Home(){
    return (
        <div className="bg-[url(images/alternative_wall.jpeg)] h-screen w-screen">
            <Header title="Our file Converter"/>
            <Bugs/>
        </div>
    );
}
