import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Game, User, Scores, Avatar, Challenge, Match, MultiplayerGame, UserAccount, LeaderboardData, LeaderboardEntry } from './types';
import { GAMES_DATA, AVATARS_DATA, GAME_INSTRUCTIONS, MULTIPLAYER_GAMES_DATA } from './constants';
import { CloseIcon, UserIcon, TrophyIcon, GithubIcon, UsersIcon, CogIcon } from './components/Icons';
import { useSound, initAudio } from './useSound';
import { useAnimatedScore } from './useAnimatedScore';

// --- Persistent Data using localStorage ---
const USERS_STORAGE_KEY = 'arc-users';
const CHALLENGES_STORAGE_KEY = 'arc-challenges';
const MATCHES_STORAGE_KEY = 'arc-matches';
const LEADERBOARD_STORAGE_KEY = 'arc-leaderboard';

const mapToJson = (map: Map<any, any>) => JSON.stringify(Array.from(map.entries()));
const jsonToMap = (jsonStr: string | null): Map<string, UserAccount> => {
    if (!jsonStr) return new Map();
    try { return new Map(JSON.parse(jsonStr)); } catch (e) { return new Map(); }
};

const loadData = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.error(`Failed to load ${key} from localStorage`, e);
        return defaultValue;
    }
};

const saveData = <T,>(key: string, data: T) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

const loadUsers = (): Map<string, UserAccount> => {
    const storedUsers = typeof window !== 'undefined' ? localStorage.getItem(USERS_STORAGE_KEY) : null;
    const userMap = jsonToMap(storedUsers);
    const today = new Date().toISOString().split('T')[0];

    if (userMap.size === 0) {
        userMap.set('player@one.com', { password: 'password123', user: { email: 'player@one.com', fullName: 'Player One', username: 'PlayerOne', avatar: 'default' }, joinDate: today, lastLoginDate: today, loginStreak: 1 });
        userMap.set('player@two.com', { password: 'password123', user: { email: 'player@two.com', fullName: 'Player Two', username: 'PlayerTwo', avatar: 'default' }, joinDate: today, lastLoginDate: today, loginStreak: 1 });
    } else {
        // Add missing properties to existing users for compatibility
        userMap.forEach(account => {
            if (!account.joinDate) account.joinDate = today;
            if (!account.lastLoginDate) account.lastLoginDate = today;
            if (account.loginStreak === undefined) account.loginStreak = 1;
        });
    }
    return userMap;
};

const mockUsers = loadUsers();

const saveUsers = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_STORAGE_KEY, mapToJson(mockUsers));
    }
};

const FUNNY_LOGIN_ERRORS = ["Did a cat walk on your keyboard? Wrong password.", "Incorrect. Maybe try 'password123'? Everyone else does.", "Are you a spy? Because that password is a secret to us too.", "That's not it. Have you tried turning it off and on again?", "Access denied. The arcade bouncer is unimpressed.", "Error 404: Password not found."];

// --- Components ---

const SplashScreen: React.FC = () => (
    <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-50 animate-fadeIn">
        <div className="text-center">
            <h1 className="text-9xl md:text-[12rem] font-orbitron text-brand-primary animate-logoReveal">A</h1>
            <p className="text-brand-secondary font-roboto-mono mt-4">Loading the future of gaming...</p>
        </div>
    </div>
);

const AuthPage: React.FC<{ onLogin: (userAccount: UserAccount) => void; }> = ({ onLogin }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const { playClick, playWin, playLose } = useSound();
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [signupFullName, setSignupFullName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupDob, setSignupDob] = useState('');
    const [signupError, setSignupError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        playClick();
        const storedAccount = mockUsers.get(loginEmail.toLowerCase());
        if (storedAccount && storedAccount.password === loginPassword) {
            playWin();
            const today = new Date().toISOString().split('T')[0];
            const lastLogin = storedAccount.lastLoginDate;
            const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];

            if (lastLogin !== today) {
                if (lastLogin === yesterday) {
                    storedAccount.loginStreak += 1; // Increment streak
                } else {
                    storedAccount.loginStreak = 1; // Reset streak
                }
                storedAccount.lastLoginDate = today;
                saveUsers();
            }
            onLogin(storedAccount);
        } else {
            playLose();
            setLoginError(FUNNY_LOGIN_ERRORS[Math.floor(Math.random() * FUNNY_LOGIN_ERRORS.length)]);
        }
    };
    
    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        playClick();
        if (mockUsers.has(signupEmail.toLowerCase())) {
            playLose();
            setSignupError('An account with this email already exists. Try logging in!');
            return;
        }
        const username = signupFullName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '') || 'NewPlayer';
        const newUser: User = { email: signupEmail.toLowerCase(), fullName: signupFullName, username: username.slice(0, 15), avatar: 'default' };
        
        const today = new Date().toISOString().split('T')[0];
        const newAccount: UserAccount = {
            password: signupPassword,
            user: newUser,
            joinDate: today,
            lastLoginDate: today,
            loginStreak: 1,
        };
        
        mockUsers.set(newUser.email, newAccount);
        saveUsers();
        playWin();
        onLogin(newAccount);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg font-roboto-mono p-4">
            <div className="w-full max-w-md p-8 bg-brand-surface rounded-xl border border-brand-border shadow-2xl shadow-brand-primary/10 animate-slideUp">
                {isLoginView ? (
                    <>
                        <h2 className="text-4xl font-orbitron text-center mb-2 text-brand-primary">Welcome Back</h2>
                        <p className="text-center text-brand-secondary/70 mb-8">Enter the arcade</p>
                        <form onSubmit={handleLogin}>
                            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" required className="w-full mb-4 px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" required className="w-full mb-6 px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                            {loginError && <p className="text-brand-danger text-center mb-4 text-sm">{loginError}</p>}
                            <button type="submit" className="w-full py-3 bg-brand-primary text-black font-bold rounded-md hover:bg-opacity-90 transition-all duration-300 animate-pulseGlow">Sign In</button>
                        </form>
                        <p className="text-center mt-6 text-sm">New challenger? <button onClick={() => setIsLoginView(false)} className="text-brand-primary hover:underline">Create an account</button></p>
                    </>
                ) : (
                    <>
                        <h2 className="text-4xl font-orbitron text-center mb-2 text-brand-primary">Join the Fun</h2>
                        <p className="text-center text-brand-secondary/70 mb-8">Create your player profile</p>
                        <form onSubmit={handleSignup} className="space-y-4">
                           <input type="text" value={signupFullName} onChange={e => setSignupFullName(e.target.value)} placeholder="Full Name" required className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                           <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                           <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                           <input type="date" value={signupDob} onChange={e => setSignupDob(e.target.value)} required className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                            {signupError && <p className="text-brand-danger text-center text-sm">{signupError}</p>}
                            <button type="submit" className="w-full py-3 bg-brand-primary text-black font-bold rounded-md hover:bg-opacity-90 transition-all duration-300 animate-pulseGlow">Sign Up</button>
                        </form>
                        <p className="text-center mt-6 text-sm">Already a member? <button onClick={() => setIsLoginView(true)} className="text-brand-primary hover:underline">Sign in</button></p>
                    </>
                )}
            </div>
        </div>
    );
};

const AvatarSelectionPage: React.FC<{ user: User, onAvatarSelect: (avatarId: string) => void }> = ({ user, onAvatarSelect }) => {
    const { playClick, playWin } = useSound();
    const handleSelect = (avatarId: string) => {
        playClick(); setTimeout(() => playWin(), 200); onAvatarSelect(avatarId);
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg font-roboto-mono p-4">
            <div className="w-full max-w-2xl p-8 bg-brand-surface rounded-xl border border-brand-border shadow-2xl shadow-brand-primary/10 animate-slideUp text-center">
                <h2 className="text-4xl font-orbitron mb-2 text-brand-primary">Choose Your Hero, {user.username}!</h2>
                <p className="text-brand-secondary/70 mb-8">Select an avatar to represent you in the arcade.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {AVATARS_DATA.map(avatar => (
                        <div key={avatar.id} onClick={() => handleSelect(avatar.id)} className="group bg-brand-bg border-2 border-brand-border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all duration-300 hover:border-brand-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-primary/20">
                            <avatar.Icon className="w-20 h-20 mb-3 transition-transform duration-300 group-hover:scale-110"/>
                            <span className="font-bold text-brand-secondary group-hover:text-brand-primary">{avatar.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const AnimatedScoreValue: React.FC<{ score: number }> = ({ score }) => {
    const animatedScore = useAnimatedScore(score);
    const [key, setKey] = useState(0);
    useEffect(() => { if (score > (key === 0 ? 0 : 1)) { setKey(prev => prev + 1); } }, [score]);
    return <span key={key} className="font-bold text-brand-primary animate-scoreUpdate">{animatedScore}</span>;
};

const Header: React.FC<{ user: User; onLogout: () => void; onOpenProfile: () => void; }> = ({ user, onLogout, onOpenProfile }) => {
    const AvatarIcon = AVATARS_DATA.find(a => a.id === user.avatar)?.Icon || UserIcon;
    return (
        <header className="fixed top-0 left-0 right-0 bg-brand-surface/80 backdrop-blur-sm border-b border-brand-border z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
                <h1 className="text-4xl font-orbitron text-brand-primary animate-logoFlicker">ARC</h1>
                <div className="flex items-center gap-2 p-2 rounded-full">
                    <AvatarIcon className="w-8 h-8 rounded-full"/>
                    <span className="hidden md:block font-roboto-mono">{user.username}</span>
                    <button onClick={onOpenProfile} className="ml-4 p-2 text-brand-secondary rounded-full hover:bg-brand-border hover:text-brand-primary transition-colors"><CogIcon className="w-5 h-5"/></button>
                    <button onClick={onLogout} className="ml-2 text-sm bg-brand-danger/20 text-brand-danger px-3 py-1 rounded hover:bg-brand-danger/40 transition-colors">Logout</button>
                </div>
            </div>
        </header>
    );
};

const GameCard: React.FC<{ game: Game; onSelect: () => void; score: number }> = ({ game, onSelect, score }) => (
    <div onClick={onSelect} className="group bg-brand-surface border border-brand-border rounded-lg p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:border-brand-primary hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-primary/20" style={{ animation: 'slideUp 0.5s ease-out forwards', opacity: 0, animationDelay: `${Math.random() * 0.5}s`}}>
        <game.Icon className="w-16 h-16 mb-4 text-brand-accent transition-transform duration-300 group-hover:scale-110" />
        <h3 className="text-xl font-orbitron mb-2">{game.name}</h3>
        <p className="text-sm text-brand-secondary/70 flex-grow mb-4">{game.description}</p>
        <div className="font-roboto-mono text-sm w-full pt-3 border-t border-brand-border flex justify-center items-center gap-2">
            <TrophyIcon className="w-4 h-4 text-yellow-400"/>
            <span>High Score: <AnimatedScoreValue score={score} /></span>
        </div>
    </div>
);

const GameModal: React.FC<{ game: Game; onClose: () => void; updateScore: (gameId: string, newScore: number) => void }> = ({ game, onClose, updateScore }) => {
    const [view, setView] = useState('instructions');
    const { playClick, playStart } = useSound();
    const instructions = GAME_INSTRUCTIONS[game.id];
    const handleStartGame = () => { playStart(); setView('game'); };
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="w-full max-w-4xl bg-brand-surface border border-brand-border rounded-xl shadow-lg relative animate-slideUp">
                <div className="flex justify-between items-center p-4 border-b border-brand-border">
                    <h2 className="text-2xl font-orbitron text-brand-primary">{game.name}</h2>
                    <button onClick={() => {playClick(); onClose()}} className="p-1 rounded-full hover:bg-brand-border transition-colors"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-4 md:p-8">
                   {view === 'instructions' ? (
                       <div className="text-center">
                           <h3 className="text-3xl font-orbitron mb-4 text-brand-accent animate-slideInFromBottom opacity-0" style={{ animationDelay: '100ms' }}>{instructions.title}</h3>
                           <ul className="list-disc list-inside text-left max-w-lg mx-auto space-y-2 mb-8 animate-slideInFromBottom opacity-0" style={{ animationDelay: '250ms' }}>
                               {instructions.rules.map((rule, index) => <li key={index}>{rule}</li>)}
                           </ul>
                           <button onClick={handleStartGame} className="px-8 py-3 bg-brand-primary text-black font-bold rounded-md hover:bg-opacity-90 transition-all duration-300 animate-pulseGlow animate-slideInFromBottom opacity-0" style={{ animationDelay: '400ms' }}>Start Game</button>
                       </div>
                   ) : ( <game.component updateScore={updateScore} /> )}
                </div>
            </div>
        </div>
    );
};

// --- Profile Modal Component ---
const ProfileModal: React.FC<{
    userAccount: UserAccount;
    scores: Scores;
    onClose: () => void;
    onUpdateProfile: (updates: Partial<User>) => boolean;
    onChangePassword: (current: string, newPass: string) => boolean;
    onAvatarSelect: (avatarId: string) => void;
}> = ({ userAccount, scores, onClose, onUpdateProfile, onChangePassword, onAvatarSelect }) => {
    const [activeTab, setActiveTab] = useState('stats');
    const { playClick, playWin, playLose } = useSound();
    
    // Form states for profile editing
    const [fullName, setFullName] = useState(userAccount.user.fullName);
    const [username, setUsername] = useState(userAccount.user.username);
    
    // Form states for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleProfileUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        playClick();
        const success = onUpdateProfile({ fullName, username });
        if (success) {
            playWin();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } else {
            playLose();
            setMessage({ type: 'error', text: 'Username or email may already be in use.' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handlePasswordChangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        playClick();
        if (newPassword !== confirmPassword) {
            playLose();
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }
        const success = onChangePassword(currentPassword, newPassword);
        if (success) {
            playWin();
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            playLose();
            setMessage({ type: 'error', text: 'Incorrect current password.' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAvatarSelect = (avatarId: string) => {
        playWin();
        onAvatarSelect(avatarId);
        setMessage({ type: 'success', text: 'Avatar updated!' });
        setTimeout(() => setMessage(null), 2000);
    };

    const tabs = ['stats', 'profile', 'password', 'avatar'];
    const tabNames = { stats: 'Stats', profile: 'Edit Profile', password: 'Change Password', avatar: 'Change Avatar' };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="w-full max-w-3xl bg-brand-surface border border-brand-border rounded-xl shadow-lg relative animate-slideUp flex flex-col md:flex-row">
                <div className="w-full md:w-48 p-4 border-b md:border-b-0 md:border-r border-brand-border">
                    <h2 className="text-xl font-orbitron mb-4">Settings</h2>
                    <nav className="flex flex-row md:flex-col gap-2">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => { playClick(); setActiveTab(tab); }} className={`w-full text-left px-3 py-2 rounded capitalize ${activeTab === tab ? 'bg-brand-primary text-black' : 'hover:bg-brand-border'}`}>
                                {tabNames[tab as keyof typeof tabNames]}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex-1 p-6 relative">
                    <button onClick={() => { playClick(); onClose(); }} className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-border transition-colors"><CloseIcon className="w-6 h-6" /></button>
                    
                    {message && <div className={`absolute top-16 right-6 p-2 rounded text-sm ${message.type === 'success' ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-danger/20 text-brand-danger'}`}>{message.text}</div>}

                    {activeTab === 'stats' && (
                        <div>
                            <h3 className="text-2xl font-orbitron mb-4">Player Stats</h3>
                            <div className="space-y-3">
                                <p><strong>Joined:</strong> {new Date(userAccount.joinDate).toLocaleDateString()}</p>
                                <p><strong>Daily Streak:</strong> {userAccount.loginStreak} day(s) 🔥</p>
                                <h4 className="text-xl font-orbitron pt-4 mt-4 border-t border-brand-border">High Scores</h4>
                                <ul className="space-y-1 max-h-60 overflow-y-auto">
                                    {GAMES_DATA.map(game => (
                                        <li key={game.id} className="flex justify-between">
                                            <span>{game.name}:</span>
                                            <span className="font-bold text-brand-accent">{scores[game.id] || 0}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div>
                            <h3 className="text-2xl font-orbitron mb-4">Edit Profile</h3>
                            <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
                                <div><label>Full Name</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-1 px-4 py-2 bg-brand-bg border border-brand-border rounded-md"/></div>
                                <div><label>Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-1 px-4 py-2 bg-brand-bg border border-brand-border rounded-md"/></div>
                                <div><label>Email (Cannot be changed)</label><input type="email" value={userAccount.user.email} disabled className="w-full mt-1 px-4 py-2 bg-brand-bg/50 border border-brand-border rounded-md text-brand-secondary/50"/></div>
                                <button type="submit" className="px-6 py-2 bg-brand-primary text-black font-bold rounded-md hover:bg-opacity-90">Save Changes</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'password' && (
                         <div>
                            <h3 className="text-2xl font-orbitron mb-4">Change Password</h3>
                            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                                <div><label>Current Password</label><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full mt-1 px-4 py-2 bg-brand-bg border border-brand-border rounded-md"/></div>
                                <div><label>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full mt-1 px-4 py-2 bg-brand-bg border border-brand-border rounded-md"/></div>
                                <div><label>Confirm New Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full mt-1 px-4 py-2 bg-brand-bg border border-brand-border rounded-md"/></div>
                                <button type="submit" className="px-6 py-2 bg-brand-primary text-black font-bold rounded-md hover:bg-opacity-90">Update Password</button>
                            </form>
                        </div>
                    )}
                    
                    {activeTab === 'avatar' && (
                        <div>
                             <h3 className="text-2xl font-orbitron mb-4">Change Avatar</h3>
                             <div className="grid grid-cols-4 gap-4">
                                {AVATARS_DATA.map(avatar => (
                                    <div key={avatar.id} onClick={() => handleAvatarSelect(avatar.id)} className={`group bg-brand-bg border-2 rounded-lg p-2 flex flex-col items-center cursor-pointer transition-all ${userAccount.user.avatar === avatar.id ? 'border-brand-primary' : 'border-brand-border hover:border-brand-primary/50'}`}>
                                        <avatar.Icon className="w-16 h-16 mb-2"/>
                                        <span className="text-sm">{avatar.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Multiplayer Components ---
const MultiplayerLobby: React.FC<{ user: User; onStartMatch: (match: Match) => void }> = ({ user, onStartMatch }) => {
    const [challenges, setChallenges] = useState<Challenge[]>(loadData(CHALLENGES_STORAGE_KEY, []));
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [selectedGameId, setSelectedGameId] = useState(MULTIPLAYER_GAMES_DATA[0].id);
    const { playClick, playWin } = useSound();

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === CHALLENGES_STORAGE_KEY && e.newValue) {
                setChallenges(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleChallenge = (e: React.FormEvent) => {
        e.preventDefault();
        playClick();
        if (!mockUsers.has(inviteeEmail.toLowerCase()) || inviteeEmail.toLowerCase() === user.email) {
            alert("Invalid user or you can't challenge yourself."); return;
        }
        const newChallenge: Challenge = { id: `chall_${Date.now()}`, inviter: user, inviteeEmail: inviteeEmail.toLowerCase(), gameId: selectedGameId, status: 'pending' };
        const updatedChallenges = [...challenges, newChallenge];
        setChallenges(updatedChallenges);
        saveData(CHALLENGES_STORAGE_KEY, updatedChallenges);
        setInviteeEmail('');
    };

    const handleAccept = (challengeId: string) => {
        playWin();
        const challenge = challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        const opponent = mockUsers.get(challenge.inviter.email)?.user;
        if (!opponent) return;

        let initialGameState = {};
        if (challenge.gameId === 'tic-tac-toe-mp') initialGameState = { board: Array(9).fill(null) };
        if (challenge.gameId === 'connect-four-mp') initialGameState = { grid: Array(6).fill(null).map(() => Array(7).fill(null)) };

        const newMatch: Match = { id: `match_${Date.now()}`, gameId: challenge.gameId, players: [opponent, user], gameState: initialGameState, turn: opponent.email };
        
        const allMatches = loadData<Match[]>(MATCHES_STORAGE_KEY, []);
        saveData(MATCHES_STORAGE_KEY, [...allMatches, newMatch]);
        
        const updatedChallenges = challenges.filter(c => c.id !== challengeId);
        setChallenges(updatedChallenges);
        saveData(CHALLENGES_STORAGE_KEY, updatedChallenges);
        
        onStartMatch(newMatch);
    };

    const myChallenges = challenges.filter(c => c.inviteeEmail === user.email && c.status === 'pending');

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-brand-surface border border-brand-border rounded-lg p-6 mb-8 animate-slideUp">
                <h3 className="text-2xl font-orbitron mb-4">Challenge a Player</h3>
                <form onSubmit={handleChallenge} className="flex flex-col sm:flex-row gap-4">
                    <input type="email" value={inviteeEmail} onChange={e => setInviteeEmail(e.target.value)} placeholder="Opponent's Email" required className="flex-grow px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none"/>
                    <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)} className="px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none">
                        {MULTIPLAYER_GAMES_DATA.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button type="submit" className="px-6 py-2 bg-brand-primary text-black font-bold rounded-md hover:bg-opacity-90">Send Challenge</button>
                </form>
            </div>
            <div className="animate-slideUp" style={{animationDelay: '0.2s'}}>
                <h3 className="text-2xl font-orbitron mb-4">Incoming Challenges</h3>
                {myChallenges.length > 0 ? (
                    <div className="space-y-3">
                        {myChallenges.map(c => (
                            <div key={c.id} className="bg-brand-surface border border-brand-border rounded-lg p-4 flex justify-between items-center">
                                <div><span className="font-bold">{c.inviter.username}</span> challenges you to <span className="font-bold">{MULTIPLAYER_GAMES_DATA.find(g=>g.id === c.gameId)?.name}</span>!</div>
                                <button onClick={() => handleAccept(c.id)} className="px-4 py-1 bg-brand-success text-black rounded">Accept</button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-brand-secondary/70">No new challenges right now.</p>}
            </div>
        </div>
    );
};

const MultiplayerGameScreen: React.FC<{ user: User; initialMatch: Match; onExit: () => void }> = ({ user, initialMatch, onExit }) => {
    const [match, setMatch] = useState<Match>(initialMatch);
    const { playClick } = useSound();
    
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === MATCHES_STORAGE_KEY && e.newValue) {
                const allMatches = JSON.parse(e.newValue) as Match[];
                const updatedMatch = allMatches.find(m => m.id === match.id);
                if (updatedMatch) setMatch(updatedMatch);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [match.id]);
    
    const handleUpdateMatch = (updatedMatch: Match) => {
        setMatch(updatedMatch);
        const allMatches = loadData<Match[]>(MATCHES_STORAGE_KEY, []);
        const newMatches = allMatches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
        saveData(MATCHES_STORAGE_KEY, newMatches);
    };

    const GameComponent = MULTIPLAYER_GAMES_DATA.find(g => g.id === match.gameId)?.component;
    const opponent = match.players.find(p => p.email !== user.email);

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 p-4 bg-brand-surface rounded-lg border border-brand-border">
                <div className="text-center">
                    <p className="font-bold text-lg">{user.username} (You)</p>
                </div>
                <div className="text-center font-orbitron text-2xl">VS</div>
                <div className="text-center">
                    <p className="font-bold text-lg">{opponent?.username}</p>
                </div>
            </div>

            {GameComponent ? <GameComponent user={user} match={match} onUpdateMatch={handleUpdateMatch} /> : <p>Error loading game.</p>}
            
            {match.winner && (
                 <div className="mt-6 text-center animate-fadeIn">
                     <p className="text-3xl font-orbitron text-brand-success mb-4">
                        {match.winner === 'Draw' ? 'The match is a draw!' : (match.winner === user.email ? 'You are victorious!' : `${opponent?.username} has won!`)}
                     </p>
                    <button onClick={() => {playClick(); onExit()}} className="px-6 py-2 bg-brand-primary text-black font-bold rounded-md hover:bg-opacity-90">Back to Lobby</button>
                 </div>
            )}
        </div>
    );
};

// --- Leaderboard Component ---
const Leaderboard: React.FC<{ leaderboard: LeaderboardData; currentUser: User; games: Game[] }> = ({ leaderboard, currentUser, games }) => {
    const [selectedGame, setSelectedGame] = useState(games[0].id);
    const { playClick } = useSound();

    const scores = leaderboard[selectedGame] || [];

    return (
        <section className="mb-16 animate-fadeIn" style={{animationDelay: '0.2s'}}>
            <h2 className="text-3xl font-orbitron mb-6 border-b-2 border-brand-primary/50 pb-2 flex items-center gap-3">
                <TrophyIcon className="w-8 h-8 text-yellow-400" />
                Leaderboard
            </h2>
            <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
                <div className="mb-4">
                    <label htmlFor="game-select" className="sr-only">Select Game</label>
                    <select
                        id="game-select"
                        value={selectedGame}
                        onChange={(e) => { playClick(); setSelectedGame(e.target.value); }}
                        className="w-full md:w-auto px-4 py-2 bg-brand-bg border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                        {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                {scores.length > 0 ? (
                    <ol className="space-y-3">
                        {scores.map((entry, index) => {
                            const isCurrentUser = entry.username === currentUser.username;
                            const rank = index + 1;
                            const AvatarIcon = AVATARS_DATA.find(a => a.id === entry.avatar)?.Icon || UserIcon;

                            return (
                                <li key={`${entry.username}-${index}`} className={`flex items-center p-3 rounded-md transition-all ${isCurrentUser ? 'bg-brand-primary/20 border-2 border-brand-primary' : 'bg-brand-bg'}`}>
                                    <span className={`w-8 text-xl font-orbitron ${rank <= 3 ? 'text-yellow-400' : 'text-brand-secondary'}`}>{rank}</span>
                                    <AvatarIcon className="w-8 h-8 rounded-full mx-4"/>
                                    <span className="flex-grow font-roboto-mono font-medium text-brand-primary">{entry.username}</span>
                                    <span className="text-xl font-orbitron text-brand-accent">{entry.score}</span>
                                </li>
                            );
                        })}
                    </ol>
                ) : (
                    <p className="text-center text-brand-secondary/70 py-4">No scores yet for this game. Be the first!</p>
                )}
            </div>
        </section>
    );
};

// --- Main App ---
type View = 'singlePlayer' | 'multiplayerLobby' | 'multiplayerGame';
type AuthStatus = 'loading' | 'unauthenticated' | 'needsAvatar' | 'authenticated';

const App: React.FC = () => {
    const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
    const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
    const [scores, setScores] = useState<Scores>({});
    const [activeGame, setActiveGame] = useState<Game | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [view, setView] = useState<View>('singlePlayer');
    const [activeMatch, setActiveMatch] = useState<Match | null>(null);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>(() => loadData(LEADERBOARD_STORAGE_KEY, {}));
    const { playClick } = useSound();
    
    const user = userAccount?.user;

    useEffect(() => {
        const timer = setTimeout(() => setAuthStatus(prev => (prev === 'loading' ? 'unauthenticated' : prev)), 2500);
        initAudio();
        
        const initialLeaderboard = loadData<LeaderboardData | null>(LEADERBOARD_STORAGE_KEY, null);
        if (initialLeaderboard === null || Object.keys(initialLeaderboard).length === 0) {
            const mockLeaderboard: LeaderboardData = {};
            const mockPlayers = [
                { username: 'CyberNinja', avatar: 'spiderman' },
                { username: 'PixelQueen', avatar: 'loki' },
                { username: 'ArcadeMaster', avatar: 'ironman' },
                { username: 'GhostRider', avatar: 'thor' },
                { username: 'CodeSlinger', avatar: 'superman' }
            ];
            GAMES_DATA.forEach(game => {
                mockLeaderboard[game.id] = mockPlayers
                    .map(player => ({
                        ...player,
                        score: Math.floor(Math.random() * (game.id.includes('clicker') ? 2000 : game.id === 'typing-speed' ? 120 : 500)) + 10,
                    }))
                    .sort((a, b) => b.score - a.score);
            });
            setLeaderboardData(mockLeaderboard);
            saveData(LEADERBOARD_STORAGE_KEY, mockLeaderboard);
        } else {
            setLeaderboardData(initialLeaderboard);
        }
        
        return () => clearTimeout(timer);
    }, []);
    
    const handleLogin = (loggedInUserAccount: UserAccount) => {
        setUserAccount(loggedInUserAccount);
        setScores(loadData(`scores-${loggedInUserAccount.user.email}`, {}));
        setAuthStatus(loggedInUserAccount.user.avatar === 'default' ? 'needsAvatar' : 'authenticated');
    };

    const handleAvatarSelect = (avatarId: string) => {
        if (!userAccount) return;
        const updatedUser = { ...userAccount.user, avatar: avatarId };
        const updatedAccount = { ...userAccount, user: updatedUser };
        setUserAccount(updatedAccount);
        mockUsers.set(userAccount.user.email, updatedAccount);
        saveUsers();
        if(authStatus === 'needsAvatar') setAuthStatus('authenticated');
    };

    const handleLogout = () => {
        playClick(); setUserAccount(null); setScores({}); setAuthStatus('unauthenticated');
    };

    const handleUpdateScore = (gameId: string, newScore: number) => {
        if (!user) return;

        setScores(prevScores => {
            const oldScore = prevScores[gameId] || 0;
            if (newScore > oldScore) {
                const newScores = { ...prevScores, [gameId]: newScore };
                saveData(`scores-${user.email}`, newScores);

                setLeaderboardData(prevData => {
                    const gameLeaderboard: LeaderboardEntry[] = prevData[gameId] ? JSON.parse(JSON.stringify(prevData[gameId])) : [];
                    const userEntryIndex = gameLeaderboard.findIndex(entry => entry.username === user.username);
                    let hasChanged = false;

                    if (userEntryIndex !== -1) {
                        if (newScore > gameLeaderboard[userEntryIndex].score) {
                            gameLeaderboard[userEntryIndex].score = newScore;
                            hasChanged = true;
                        }
                    } else {
                        gameLeaderboard.push({ username: user.username, avatar: user.avatar, score: newScore });
                        hasChanged = true;
                    }

                    if (hasChanged) {
                        const updatedGameLeaderboard = gameLeaderboard
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 10);
                        const newData = { ...prevData, [gameId]: updatedGameLeaderboard };
                        saveData(LEADERBOARD_STORAGE_KEY, newData);
                        return newData;
                    }
                    return prevData;
                });
                return newScores;
            }
            return prevScores;
        });
    };
    
    const handleUpdateProfile = (updates: Partial<User>): boolean => {
        if (!userAccount) return false;
        const updatedUser = { ...userAccount.user, ...updates };
        const updatedAccount = { ...userAccount, user: updatedUser };

        mockUsers.set(userAccount.user.email, updatedAccount);
        saveUsers();
        setUserAccount(updatedAccount);
        return true;
    };
    
    const handleChangePassword = (current: string, newPass: string): boolean => {
        if (!userAccount || userAccount.password !== current) return false;
        
        const updatedAccount = { ...userAccount, password: newPass };
        mockUsers.set(userAccount.user.email, updatedAccount);
        saveUsers();
        setUserAccount(updatedAccount);
        return true;
    };
    
    const handleStartMatch = (match: Match) => {
        setActiveMatch(match);
        setView('multiplayerGame');
    };

    const featuredGame = useMemo(() => GAMES_DATA[Math.floor(Math.random() * GAMES_DATA.length)], []);

    if (authStatus === 'loading') return <SplashScreen />;
    if (authStatus === 'unauthenticated') return <AuthPage onLogin={handleLogin} />;
    if (authStatus === 'needsAvatar' && user) return <AvatarSelectionPage user={user} onAvatarSelect={handleAvatarSelect} />;

    if (authStatus === 'authenticated' && user && userAccount) {
        return (
            <div className="font-roboto-mono">
                <Header user={user} onLogout={handleLogout} onOpenProfile={() => {playClick(); setIsProfileModalOpen(true);}} />
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28">
                    <div className="flex justify-center mb-8 border-b-2 border-brand-border">
                        <button onClick={() => {playClick(); setView('singlePlayer')}} className={`px-6 py-2 text-xl font-orbitron ${view==='singlePlayer' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-brand-secondary'}`}><UserIcon className="w-5 h-5 inline mr-2"/>Single Player</button>
                        <button onClick={() => {playClick(); setView('multiplayerLobby')}} className={`px-6 py-2 text-xl font-orbitron ${view !=='singlePlayer' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-brand-secondary'}`}><UsersIcon className="w-5 h-5 inline mr-2"/>Multiplayer</button>
                    </div>

                    {view === 'singlePlayer' && (
                        <>
                        <section className="mb-16 animate-fadeIn">
                            <h2 className="text-3xl font-orbitron mb-6 border-b-2 border-brand-primary/50 pb-2">Game of the Day</h2>
                            <div className="bg-brand-surface p-8 rounded-lg border border-brand-border flex flex-col md:flex-row items-center gap-8">
                                <featuredGame.Icon className="w-32 h-32 text-brand-accent"/>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-4xl font-orbitron text-brand-accent">{featuredGame.name}</h3>
                                    <p className="mt-2 text-brand-secondary/80">{featuredGame.description}</p>
                                    <button onClick={() => { playClick(); setActiveGame(featuredGame); }} className="mt-6 px-8 py-3 bg-brand-primary text-black font-bold rounded-md hover:bg-opacity-90 transition-all duration-300 animate-pulseGlow">Play Now</button>
                                </div>
                            </div>
                        </section>
                        <Leaderboard leaderboard={leaderboardData} currentUser={user} games={GAMES_DATA} />
                        <section>
                            <h2 className="text-3xl font-orbitron mb-8 border-b-2 border-brand-primary/50 pb-2">All Games</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {GAMES_DATA.map(game => ( <GameCard key={game.id} game={game} onSelect={() => { playClick(); setActiveGame(game); }} score={scores[game.id] || 0}/> ))}
                            </div>
                        </section>
                        </>
                    )}

                    {view === 'multiplayerLobby' && <MultiplayerLobby user={user} onStartMatch={handleStartMatch}/>}
                    
                    {view === 'multiplayerGame' && activeMatch && <MultiplayerGameScreen user={user} initialMatch={activeMatch} onExit={() => { setView('multiplayerLobby'); setActiveMatch(null); }}/>}

                </main>
                <Footer />
                {activeGame && <GameModal game={activeGame} onClose={() => setActiveGame(null)} updateScore={handleUpdateScore} />}
                {isProfileModalOpen && <ProfileModal userAccount={userAccount} scores={scores} onClose={() => setIsProfileModalOpen(false)} onUpdateProfile={handleUpdateProfile} onChangePassword={handleChangePassword} onAvatarSelect={handleAvatarSelect} />}
            </div>
        );
    }
    
    return <div>Something went wrong...</div>;
};

const Footer: React.FC = () => (
    <footer className="w-full py-8 mt-16 border-t border-brand-border">
        <div className="container mx-auto text-center text-brand-secondary/70">
            <p>&copy; {new Date().getFullYear()} ARC. All rights reserved.</p>
            <p className="mt-2">For inquiries, contact us at <a href="mailto:contact@arc.dev" className="text-brand-primary hover:underline">contact@arc.dev</a></p>
            <div className="flex justify-center mt-4"><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:text-brand-primary transition-colors"><GithubIcon className="w-6 h-6" /></a></div>
        </div>
    </footer>
);


export default App;