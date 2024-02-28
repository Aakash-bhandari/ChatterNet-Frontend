import React from 'react'
import { Route, Routes, Router } from 'react-router-dom';
import Home from './GuestModeComp/Home';
import ChatPage from './GuestModeComp/GuestChatPage';
function GuestMode() {
    return (
        <div>
            <Routes>
                <Route path="/guest" element={<Home/>} />
                <Route path='/guestUser' element={<ChatPage/>} exact/>
            </Routes>
        </div>
    )
}

export default GuestMode
