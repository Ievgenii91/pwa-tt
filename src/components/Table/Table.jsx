import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

export default function UsersTable({ rows, callback }) {
	return (
		<TableContainer component={Paper}>
			<Table sx={{ minWidth: 650 }} aria-label="simple table">
				<TableHead>
					<TableRow>
						<TableCell>ПІБ</TableCell>
						<TableCell>Початок зміни</TableCell>
						<TableCell align="right"></TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.map((row) => (
						<TableRow
							key={row.name}
							sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
						>
							<TableCell component="th" scope="row">
								{row.name}
							</TableCell>
							<TableCell>{row.date}</TableCell>
							<TableCell align="right">
								<Button variant="outlined" onClick={() => callback(row)}>
									Завершити
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
