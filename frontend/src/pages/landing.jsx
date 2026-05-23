import React from 'react'
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';



export default function LandingPage() {
    const router = useNavigate();
  return (
    
    <div className='landing-page'>
        <nav className='navbar'>
            <div className='heading'>
                <h2>MeetSync</h2>
            </div>
            <div className='nav-links'>
                <div role='button' onClick={() => router('/meeting/guest-room')}>Join as Guest</div>
                <Link to="/auth">Register</Link>
                <div role='button' onClick={() => router('/auth')}>Login</div>
            </div>
        </nav>


        <div className="landingMainContainer">
            <div className="landingMainContent">
                <h1><span style={{color:"#ff9839"}}>Connect</span> With Your Loved Ones</h1>
                <p>Experience seamless video conferencing with MeetSync. Connect with friends, family, and colleagues effortlessly. Join or create meetings in seconds and stay connected no matter where you are.</p>
                <div role='button'>
                    <Link to={"/auth"}>Get Started</Link>
                </div>
            </div>
            <div>
                <img src="/mobile.png" alt="Landing Page" className='landingImage' />
            </div>
        </div>
    </div>
  )
}
