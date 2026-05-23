import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';

const defaultTheme = createTheme();

export default function Authentication() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        try {
            setError('');
            if (formState === 0) {
                await handleLogin(username, password);
                return;
            }
            const result = await handleRegister(name, username, password);
            setUsername('');
            setName('');
            setPassword('');
            setMessage(result || 'Your account has been created successfully.');
            setOpen(true);
            setFormState(0);
        } catch (err) {
            console.error(err);
            const apiMessage = err?.response?.data?.message;
            setError(apiMessage || 'Unable to process request. Please try again.');
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid
                container
                component="main"
                sx={{
                    minHeight: '100vh',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f4f7fb',
                    p: 2,
                }}
            >
                <CssBaseline />
                <Grid item xs={12} sm={10} md={6} lg={4}>
                    <Paper elevation={10} sx={{ borderRadius: 3, p: 4, position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 52, height: 52 }}>
                                <LockOutlinedIcon fontSize="large" />
                            </Avatar>
                            <Box>
                                <Typography component="h1" variant="h5">
                                    MeetSync
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Login or register to start your meeting workflow.
                                </Typography>
                            </Box>
                        </Box>

                        <Tabs
                            value={formState}
                            onChange={(event, newValue) => setFormState(newValue)}
                            variant="fullWidth"
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{ mb: 3 }}
                        >
                            <Tab label="Sign In" />
                            <Tab label="Sign Up" />
                        </Tabs>

                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="fullName"
                                label="Full Name"
                                name="fullName"
                                value={name}
                                autoFocus={formState === 1}
                                onChange={(e) => setName(e.target.value)}
                                sx={{ display: formState === 1 ? 'block' : 'none' }}
                            />

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                autoFocus={formState === 0}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            {error && (
                                <Typography color="error" sx={{ mt: 2, mb: 1 }}>
                                    {error}
                                </Typography>
                            )}

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 1, py: 1.3 }}
                                onClick={handleAuth}
                            >
                                {formState === 0 ? 'Login' : 'Register'}
                            </Button>

                            <Typography variant="body2" color="text.secondary" align="center">
                                {formState === 0
                                    ? 'New to MeetSync? Create an account to get started.'
                                    : 'Already have an account? Use Sign In to access your workspace.'}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
                onClose={() => setOpen(false)}
            />
        </ThemeProvider>
    );
}
