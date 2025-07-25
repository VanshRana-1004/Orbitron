"use client"
interface props{
    color : string,
    width : string,
    height : string,
    onClick : VoidFunction
    className : string
}

export default function ClosedEye(props : props){
    return <svg className={props.className} onClick={props.onClick} width={props.width} height={props.height} viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color={props.color}><path d="M19.5 16L17.0248 12.6038"  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 17.5V14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M4.5 16L6.96895 12.6124" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3 8C6.6 16 17.4 16 21 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
}