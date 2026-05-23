import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Avatar, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups';
import ShieldIcon from '@mui/icons-material/Shield';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    const { addToUserHistory, logout, userData } = useContext(AuthContext);

    const createMeetingCode = () => {
        return Math.random().toString(36).substring(2, 9).toUpperCase();
    }

    const [suggestedCode] = useState(createMeetingCode());

    const handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode.trim());
        navigate(`/meeting/${meetingCode.trim()}`);
    }

    const handleCreateMeeting = async () => {
        const code = createMeetingCode();
        await addToUserHistory(code);
        navigate(`/meeting/${code}`);
    }

    return (
        <div className="homePage">
            <div className="navBar">
                <div className="brand">
                    <Typography variant="h4">MeetSync</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back, {userData?.name || 'Host'}
                    </Typography>
                </div>

                <div className="navActions">
                    <Button startIcon={<RestoreIcon />} color="secondary" onClick={() => navigate('/history')}>
                        History
                    </Button>
                    <Button variant="contained" color="secondary" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </div>

            <Box className="heroRow">
                <Card className="heroCard" elevation={4}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            Ready to host your next meeting?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Start instantly with a secure meeting room, invite guests with one link, and keep your meeting history safe for later.
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                            <Avatar sx={{ bgcolor: '#5c6ac4' }}>M</Avatar>
                            <Typography>
                                Recommended code: <strong>{suggestedCode}</strong>
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>

                <div className="statsGrid">
                    <Card className="infoCard" elevation={3}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Secure Calls
                            </Typography>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShieldIcon fontSize="small" /> Encrypted by default
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card className="infoCard" elevation={3}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Instant Rooms
                            </Typography>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon fontSize="small" /> Create in one click
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card className="infoCard" elevation={3}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Team sync
                            </Typography>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GroupsIcon fontSize="small" /> Simple, Reliable
                            </Typography>
                        </CardContent>
                    </Card>
                </div>
            </Box>

            <div className="meetContainer">
                <Card elevation={6} className="leftPanel">
                    <CardContent>
                        <Typography variant="h4" gutterBottom>
                            Start or join a meeting in seconds
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Create a private room or enter a meeting code to connect with teammates, friends, or family.
                        </Typography>

                        <div className="joinControls">
                            <TextField
                                value={meetingCode}
                                onChange={e => setMeetingCode(e.target.value)}
                                id="meeting-code"
                                label="Meeting Code"
                                variant="outlined"
                                fullWidth
                            />
                            <div className="buttonGroup">
                                <Button variant='contained' size='large' onClick={handleJoinVideoCall}>
                                    Join Meeting
                                </Button>
                                <Button variant='outlined' size='large' onClick={handleCreateMeeting}>
                                    Create Meeting
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className='rightPanel'>
                    <img srcSet='/meetsync.png' alt="MeetSync preview" className="homePreviewImage" />
                </div>
            </div>
        </div>
    )
}

export default withAuth(HomeComponent);