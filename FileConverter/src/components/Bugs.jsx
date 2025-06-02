// import bugs from "Communist_Bugs_Bunny.jpg"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

 //bg-[rgb(209, 203, 93)]
//bg-amber-100
//
//<img src="images/kremul.png" />
export default function Bugs() {
    const navigate = useNavigate();
    return (
        <div className="">
            <img src="images/Communist_Bugs_Bunny.jpg" />
            <Button 
                className="bg-amber-200 hover:bg-amber-400 relative bottom-11 left-111 px-12"
                onClick={() => navigate("/pager")}
            >Submit</Button>
        </div>
    );
}
