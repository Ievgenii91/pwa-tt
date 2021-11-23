import React, { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';

import UsersTable from '../Table/Table';
import { get, post, patch } from '../../services/http/index';

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400,
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	pt: 2,
	px: 4,
	pb: 3,
};

const dateToString = (d) => {
	if (!d) {
		return null;
	}
	return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
};

const sync = [];

export default function Home() {
	const pass = localStorage.getItem('mps');
	const [selectedEmployee, setSelectedEmployee] = useState(null);
	const [action, setAction] = useState(null);
	const [loading, setLoading] = useState(false);
	const [logined, setLogined] = useState(
		process.env.REACT_APP_PASSWORD === pass
	);
	const [employees, setEmployees] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function fetchData() {
			setLoading(true);
			setError(null);
			try {
				const data = await get(
					process.env.REACT_APP_HOST + 'api/v1/employees',
					{ clientId: process.env.REACT_APP_CLIENT_ID }
				);
				setEmployees(
					data.map((v) => ({ ...v, date: dateToString(new Date(v.started)) }))
				);
			} catch (e) {
				setError(
					'Схоже відсутній звязок, дані будуть автоматично синхронізовані'
				);
			} finally {
				setLoading(false);
			}
		}
		fetchData();

		window.addEventListener('online', () => {
			alert('Ви у мережі');
			setLoading(true);
		});
		window.addEventListener('offline', () => alert('Пропала мережа'));

		navigator.serviceWorker.addEventListener('message', (event) => {
			console.log('sync', event.data);
			const timer = setTimeout(async () => {
				await fetchData();
				clearTimeout(timer);
			}, 2000);
		});

		return () => {
			window.removeEventListener('online');
			window.removeEventListener('offline');
			navigator.serviceWorker.removeEventListener('message');
		};
	}, []);

	const handleChange = (event) => {
		setSelectedEmployee(employees.find((v) => v.name === event.target.value));
	};

	const start = useCallback(async () => {
		setLoading(true);
		let syncLocally = false;
		const date = new Date();
		try {
			await patch(
				process.env.REACT_APP_HOST + 'api/v1/employees/' + selectedEmployee._id,
				{
					...selectedEmployee,
					started: date,
					date: null,
				}
			);
			const data = await get(process.env.REACT_APP_HOST + 'api/v1/employees', {
				clientId: process.env.REACT_APP_CLIENT_ID,
			});
			setEmployees(
				data.map((v) => ({ ...v, date: dateToString(new Date(v.started)) }))
			);
		} catch (e) {
			setError(
				'Схоже відсутній звязок, дані будуть автоматично синхронізовані'
			);
			syncLocally = true;
		} finally {
			if (syncLocally) {
				setEmployees((data) => {
					return data.map((v) => {
						if (v._id === selectedEmployee._id) {
							return {
								...v,
								date: dateToString(new Date(date)),
								started: date,
							};
						}
						return v;
					});
				});
			}
			setSelectedEmployee(null);
			setLoading(false);
		}
	}, [selectedEmployee]);

	const triggerStop = useCallback(async (selected) => {
		let syncLocally = false;
		setLoading(true);
		try {
			await post(process.env.REACT_APP_HOST + 'api/v1/timetracking', {
				employeeName: selected.name,
				employeeId: selected._id,
				startDate: selected.started,
				endDate: new Date(),
				ratePerHour: selected.ratePerHour,
				clientId: process.env.REACT_APP_CLIENT_ID,
			});
		} catch (e) {
			syncLocally = true;
			setError(
				'Схоже відсутній звязок, дані будуть автоматично синхронізовані'
			);
		}
		try {
			await patch(
				process.env.REACT_APP_HOST + 'api/v1/employees/' + selected._id,
				{
					...selected,
					started: null,
				}
			);
			const data = await get(process.env.REACT_APP_HOST + 'api/v1/employees', {
				clientId: process.env.REACT_APP_CLIENT_ID,
			});
			setEmployees(
				data.map((v) => ({ ...v, date: dateToString(new Date(v.started)) }))
			);
		} catch (e) {
			syncLocally = true;
			setError(
				'Схоже відсутній звязок, дані будуть автоматично синхронізовані'
			);
		} finally {
			if (syncLocally) {
				setEmployees((data) => {
					return data.map((v) => {
						if (v._id === selected._id) {
							return {
								...v,
								started: null,
								date: null,
							};
						} else {
							return v;
						}
					});
				});
			}
			setSelectedEmployee(null);
			setLoading(false);
		}
	}, []);

	const [open, setOpen] = useState(false);
	const handleClose = useCallback(
		(skip) => {
			setOpen(false);
			setAllowContinue(false);
			if (skip) {
				return;
			}
			const { stop, data } = action;
			if (stop) {
				triggerStop(data);
			} else {
				start();
			}
		},
		[start, action, triggerStop]
	);

	const openModal = useCallback(({ stop, data }) => {
		setOpen(true);
		setAction({ stop, data });
	}, []);

	const [allowContinue, setAllowContinue] = useState(false);
	const [passCorrect, setPassCorrect] = useState(false);
	const checkPassword = (e) => {
		const emp = action.data || selectedEmployee;
		setAllowContinue(e.target.value === emp.password);
	};

	const handleLoginClose = useCallback(() => {
		setLogined(true);
	}, []);

	const checkLoginPassword = useCallback(({ target }) => {
		if (target.value === process.env.REACT_APP_PASSWORD) {
			localStorage.setItem('mps', process.env.REACT_APP_PASSWORD);
			setPassCorrect(true);
		} else {
			localStorage.removeItem('mps');
			setPassCorrect(false);
		}
	}, []);

	if (!logined) {
		return (
			<Modal
				open={true}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={{ ...style, minWidth: 120 }}>
					<Typography id="modal-modal-title" variant="h6" component="h2">
						Введіть пароль
					</Typography>
					<Typography
						id="modal-modal-description"
						sx={{ mt: 2, width: '100%' }}
					>
						<TextField
							sx={{ mt: 2, width: '100%' }}
							id="password"
							label="Пароль"
							variant="standard"
							type="password"
							onChange={(e) => checkLoginPassword(e)}
						/>
					</Typography>
					<Box
						sx={{
							textAlign: 'center',
							margin: '50px 0 20px 0',
						}}
					>
						<Button
							variant="contained"
							disabled={!passCorrect}
							onClick={() => handleLoginClose()}
						>
							Підтвердити
						</Button>
					</Box>
				</Box>
			</Modal>
		);
	}

	if (loading) {
		return (
			<div className="page">
				<CircularProgress />
			</div>
		);
	}

	return (
		<div className="page">
			<div className="content">
				{error && (
					<Box sx={{ minWidth: 120 }} m={2} pt={3}>
						<Alert severity="error">{error}</Alert>
					</Box>
				)}
				<Box sx={{ minWidth: 120 }} m={2} pt={3}>
					<FormControl fullWidth>
						<InputLabel id="demo-simple-select-label">Член команди</InputLabel>
						<Select
							labelId="demo-simple-select-label"
							id="demo-simple-select"
							value={selectedEmployee?.name}
							label="Ім'я"
							onChange={handleChange}
						>
							{employees
								.filter((v) => !v.started)
								.map(({ name, position }) => (
									<MenuItem key={name} value={name}>
										<span>{position} ---</span>&nbsp; {name}
									</MenuItem>
								))}
						</Select>
					</FormControl>
				</Box>
				<Box sx={{ minWidth: 120, textAlign: 'center' }} m={2} pt={3}>
					<Button
						size={'large'}
						variant="contained"
						disabled={!selectedEmployee}
						onClick={() => openModal({ stop: false })}
					>
						СТАРТ
					</Button>
				</Box>
				<Box sx={{ minWidth: 120 }} m={2} pt={3}>
					<UsersTable
						rows={employees.filter((v) => !!v.started)}
						callback={(data) => openModal({ stop: true, data })}
					></UsersTable>
				</Box>

				<Modal
					open={open}
					onClose={() => handleClose(true)}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box sx={{ ...style, minWidth: 120 }}>
						<Typography id="modal-modal-title" variant="h6" component="h2">
							Введіть Ваш персональний пароль
						</Typography>
						<Typography
							id="modal-modal-description"
							sx={{ mt: 2, width: '100%' }}
						>
							<TextField
								sx={{ mt: 2, width: '100%' }}
								id="password"
								label="Пароль"
								variant="standard"
								type="password"
								onChange={(e) => checkPassword(e)}
							/>
						</Typography>
						<Box
							sx={{
								textAlign: 'center',
								margin: '50px 0 20px 0',
							}}
						>
							<Button
								variant="contained"
								disabled={!allowContinue}
								onClick={() => handleClose()}
							>
								Підтвердити
							</Button>
						</Box>
					</Box>
				</Modal>
			</div>
		</div>
	);
}
