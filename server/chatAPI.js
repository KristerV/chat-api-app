ChatAPImessages = new Mongo.Collection('chatAPI_messages')
ChatAPIusers = new Mongo.Collection('chatAPI_users')

HTTP.methods({
	'/chatAPI/getUsersInRoom': function() {
		console.log('getUsersInRoom:', this.query)
		var data = ChatAPImessages.find({room: this.query.room || 'default'}, {sort: {username: 1}}).fetch()
		console.log(data)
		var plucked = _.uniq(_.pluck(data, 'username'))
		return response(this.query.callback, {result: 'success', users: plucked})
	},
	'/chatAPI/registerUser': function(params) {
		console.log('registerUser:', this.query)
		var username = this.query.username
		if (!username)
			return response(this.query.callback, {result: 'error', reason: "No user name provided"})

		var userFound = !!ChatAPIusers.findOne({username: username})
		if (userFound)
			return response(this.query.callback, {result: 'error', reason: "User already exists"})

		var id = ChatAPIusers.insert({username: username})
		return response(this.query.callback, {result: 'success', userId: id, username: username})
	},
	'/chatAPI/getMessages': function() {
		console.log('getMessages:', this.query)
		var room = this.query.room || 'default'
		var lastId = this.query.lastId || null // TODO

		var find = {room: room}

		var lastMsg = ChatAPImessages.findOne(lastId)
		if (!!lastMsg)
			find.date = {$gt: lastMsg.date}

		var messages = ChatAPImessages.find(find).fetch()
		return response(this.query.callback, {result: 'success', messages: messages})
	},
	'/chatAPI/newMessage': function() {
		console.log('newMessage:', this.query)
		var userId = this.query.userId
		var username = this.query.username

		if (ChatAPIusers.findOne({_id: userId, username: username})) {
			var id = ChatAPImessages.insert({
				room: this.query.room || 'default',
				username: username,
				message: this.query.message,
				date: new Date(),
			})
			return response(this.query.callback, {result: 'success', messageId: id})
		} else {
			return response(this.query.callback, {result: 'error', reason: "Authentication error: userId and username don't match"})
		}
	},
	'chatAPI/deleteEverything': function() {
		console.log('deleteEverything', this.query)
		var result1 = ChatAPImessages.remove({})
		var result2 = ChatAPIusers.remove({})
		return "nice job, all chat history is now gone."
	}
});

var response = function(callback, data) {
	return callback + "(" + JSON.stringify(data) + ")"
}