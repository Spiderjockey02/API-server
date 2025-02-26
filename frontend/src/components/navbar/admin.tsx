import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import type { User } from '@/types/next-auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faFileAlt, faCogs, faSignOutAlt, faBars, faX } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Notifications } from '@/types';

interface Props {
	user: User;
	showSidebar: boolean;
	setShowSidebar: (arg0: boolean) => void;
}

export default function Admin({ user, showSidebar, setShowSidebar }: Props) {
	const [notifications, setNotifications] = useState<Notifications[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await axios.get('/api/session/notifications');
				setNotifications(data.notifications);
			} catch (err) {
				console.log(err);
			}
		})();
	}, []);

	return (
		<nav className="navbar navbar-expand navbar-light static-top shadow" style={{ paddingLeft:'5px' }}>
			<ul className="navbar-nav me-auto mb-2 mb-lg-0">
				<a type="button" className="nav-link" onClick={() => setShowSidebar(!showSidebar)}>
					<FontAwesomeIcon icon={showSidebar ? faX : faBars} />
				</a>
			</ul>
			<ul className="navbar-nav ml-auto">
				<li className="nav-item dropdown no-arrow mx-1">
					<a type="button" className="nav-link dropdown-toggle position-relative" id="alertsDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<FontAwesomeIcon icon={faBell} />
						{notifications.length > 0 ?
							<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
								{notifications.length}
								<span className="visually-hidden">unread messages</span>
							</span>
							: null
						}
					</a>
					<div className="dropdown-menu dropdown-menu-end shadow animated--grow-in" aria-labelledby="alertsDropdown">
						<h6 className="dropdown-header">
              Alerts Center
						</h6>
						{notifications.map((notifs) =>
							<Link className="dropdown-item d-flex align-items-center" href={`/notifications#${notifs.id}`} key={notifs.id}>
								<div className="me-3">
									<div className="icon-circle bg-primary">
										<FontAwesomeIcon icon={faFileAlt} style={{ color: 'white' }} />
									</div>
								</div>
								<div>
									<div className="small text-gray-500">{new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(new Date(notifs.createdAt))}</div>
									<span className="font-weight-bold">{notifs.header}</span>
								</div>
							</Link>,
						)}
						<Link className="dropdown-item text-center small text-gray-500" href="/notifications">Show All Alerts</Link>
					</div>
				</li>
				<div className="topbar-divider d-none d-sm-block"></div>
				<li className="nav-item dropdown no-arrow">
					<a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<span className="mr-2 d-none d-lg-inline text-gray-600 small">{user.displayName} </span>
						<Image className="img-profile rounded-circle" src={user.avatar} alt="..." width={32} height={32}/>
					</a>
					<div className="dropdown-menu dropdown-menu-end shadow animated--grow-in" aria-labelledby="userDropdown">
						<Link className="dropdown-item" href="/settings" style={{ color: 'grey' }}>
							<FontAwesomeIcon icon={faCogs} />
							<span> Settings</span>
						</Link>
						<div className="dropdown-divider"></div>
						<Link className="dropdown-item" onClick={() => signOut()} href="/" style={{ color: 'grey' }}>
							<FontAwesomeIcon icon={faSignOutAlt} />
							<span> Logout</span>
						</Link>
					</div>
				</li>
			</ul>
		</nav>
	);
}
