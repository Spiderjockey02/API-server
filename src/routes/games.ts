import { Router } from 'express';
const router = Router();
import axios from 'axios';
import R6API from 'r6api.js';
import { status } from 'minecraft-server-util';
import config from '../config';
const { findByUsername, getProgression, getRanks, getStats } = new R6API({ email: config.rainbow.email, password: config.rainbow.password });

export default function() {
	router.get('/fortnite', async (req, res) => {
		const { platform, username } = req.query;
		try {
			const data = await axios.get(`https://api.fortnitetracker.com/v1/profile/${platform}/${encodeURIComponent(username as string)}`, {
				headers: { 'TRN-Api-Key': config.fortniteAPI },
			});
			res.json(data);
		} catch (err: any) {
			console.log(err);
			res.json({ error: err.message });
		}
	});

	router.get('/mc', async (req, res) => {
		const { IP } = req.query;
		try {
			const response = await status(IP as string);
			res.json(response);
		} catch (err: any) {
			console.log(err);
			res.json({ error: err.message });
		}
	});

	router.get('/r6', async (req, res) => {
		type Platform = 'xbl' | 'uplay' | 'psn';
		let { player } = req.query;
		const { platform } = req.query;
		if (platform === 'xbl') player = (player as string).replace('_', '');

		let foundPlayer;
		try {
			foundPlayer = await findByUsername(platform as Platform, player as string);
			console.log();
		} catch (err: any) {
			return res.json({ error: err.message });
		}
		console.log(foundPlayer);
		// Makes sure that user actually exist
		if (foundPlayer.length == 0) res.json({ error: 'No player found.' });

		// get statistics of player
		try {
			const [playerRank, playerStats, playerGame] = await Promise.all([getRanks(platform as Platform, foundPlayer[0].id), getStats(platform as Platform, foundPlayer[0].id), getProgression(platform as Platform, foundPlayer[0].id)]);
			res.json(Object.assign(playerRank, playerGame, playerStats));
		} catch (err: any) {
			console.log(err);
			res.json({ err: err.message });
		}
		// /
	});


	return router;
}
