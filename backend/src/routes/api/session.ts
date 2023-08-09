import { Router } from 'express';
import type Client from '../../helpers/Client';
import { TokenGenerator, TokenBase } from 'ts-token-generator';
import { Utils } from '../../utils';
const router = Router();

export function run(client: Client) {
	router.post('/signIn', async (req, res) => {
		const userId = BigInt(req.query.userId as string);
		const { avatar, discriminator, locale, email, username } = req.body;

		// Create avatar URL
		let image_url;
		if (avatar == null) {
			// Check if they are still on legacy discriminator system
			if (discriminator && discriminator != '0') {
				image_url = `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
			} else {
				image_url = `https://cdn.discordapp.com/embed/avatars/${Number(userId >> BigInt(22)) % 6}.png`;
			}
		} else {
			image_url = `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`;
		}

		// Fetch / create user
		try {
			let user = await client.UserManager.fetchByParam({ id: BigInt(userId) });
			if (user == null) {
				user = await client.UserManager.create({ id: userId,
					token: new TokenGenerator({ bitSize: 512, baseEncoding: TokenBase.BASE62 }).generate(),
					avatar: image_url,
					locale, email, username,
				});
			}

			// Send updated profile back to user
			res.json({
				id: `${userId}`,
				role: user.role,
				avatar: image_url,
				token: user.token,
				username, email,
			});

			// Update the database if any changes are found
			if (username != user.username || image_url != user.avatar) await client.UserManager.update({ id: userId, username, avatar: image_url });
		} catch (err) {
			console.log(err);
			res.json();
		}
	});

	router.get('/history', async (req, res) => {
		const ses = await Utils.getSession(req);
		const page = req.query.page;

		if (ses?.user) {
			const [history, total] = await Promise.all([client.UserHistoryManager.fetchEndpointUsagesPerUser({ userId: BigInt(ses.user.id), page: (page && !Number.isNaN(page)) ? Number(page) : 0 }),
				client.UserHistoryManager.fetchCountByUserId(BigInt(ses.user.id))]);

			res.json({ history: history.map(h => ({ ...h, userId: `${ses.user.id}` })), total });
		} else {
			res.json({ history: [], total: 0 });
		}
	});

	router.get('/history/graph', async (req, res) => {
		const ses = await Utils.getSession(req);

		if (ses?.user) {
			const t = await client.UserHistoryManager.fetchEndpointCountByUser(BigInt(ses.user.id));
			res.json({ data: t });
		}
	});

	// Regenerate a new token
	router.post('/regenerate', async (req, res) => {
		const ses = await Utils.getSession(req);
		if (ses?.user) {
			try {
				const token = new TokenGenerator({ bitSize: 512, baseEncoding: TokenBase.BASE62 }).generate();
				await client.UserManager.update({ id: BigInt(ses.user.id), newToken: token });
				res.json({ success: 'Successfully updated users token', token });
			} catch (err) {
				console.log(err);
				res.json({ error: 'Failed to update users token' });
			}
		} else {
			res.json({ error: 'Error' });
		}
	});

	router.get('/stats', async (_req, res) => {
		try {
			const [users, endpoints, endpointUsage] = await Promise.all([client.UserManager.fetchCount(), client.EndpointManager.fetchCount(), client.UserHistoryManager.fetchCount()]);
			res.json({
				userCount: users,
				endpointCount: endpoints,
				historyCount: endpointUsage,
			});
		} catch (err) {
			res.json({
				userCount: 0,
				endpointCount: 0,
				historyCount: 0,
			});
		}
	});

	return router;
}
