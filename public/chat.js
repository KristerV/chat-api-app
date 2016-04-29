$(document).ready(function(){

	$('form[name="newuser"]').on('submit', function(e){
		e.preventDefault()
		var username = $('input[name=username]').val()
		$('input[name=username]').val('')
		Chat.registerUser(username)
	});

	$('form[name="newmessage"]').on('submit', function(e){
		e.preventDefault()
		var message = $('input[name=message]').val()
		$('input[name=message]').val('')
		Chat.newMessage(message)
	});

	$('form[name="changeRoom"]').on('submit', function(e){
		e.preventDefault()
		var newroom = $('input[name=newroom]').val()
		Chat.currentRoom = newroom
		Chat.lastMessageId = null
		$('#messages').empty()
		Chat.getMessages()
		Chat.usersInRoom = []
		$('#users').empty()
	});

	Chat.startTimer()
})

Chat = {
	currentRoom: null,
	lastMessageId: null,
	currentUser: null,
	usersInRoom: [],
	'getUsersInRoom': function() {
		$.ajax({
			url:"chatAPI/getUsersInRoom",
			type:'GET',
			dataType:'JSONP',
			data: {
				room: Chat.currentRoom,
			},
			success: function(response){
				console.log('getUsersInRoom')
				if (response.result == 'error') {
					error('ERROR: ' + response.reason)
				} else if (response.users.length > 0) {
					$('#users').empty()
					response.users.forEach(function(user){
						$('#users').append('<p>'+user+'</p>')
					});
				}
			}
		});
	},
	'registerUser': function(username) {

		if (localStorage.getItem(username)) {
			console.log("logged in")
			Chat.currentUser = username
			$('form[name="newuser"]').hide()
			$('form[name="newmessage"]').show()
			$('input[name=message]').focus()
		} else {
			$.ajax({
				url:"chatAPI/registerUser",
				type:'GET',
				dataType:'JSONP',
				data: {
					username: username
				},
				success: function(response){
					console.log('registerUser')
					if (response.result == 'error') {
						error('ERROR: ' + response.reason)
					} else {
						Chat.currentUser = username
						$('form[name="newuser"]').hide()
						$('form[name="newmessage"]').show()
						$('input[name=message]').focus()
						localStorage.setItem(username, response.userId)
						Chat.newMessage('<i style="color:rgba(0,0,0,0.4)">has joined the room</i>')
					}
				}
			});
		}

	},
	'getMessages': function() {
		$.ajax({
			url:"chatAPI/getMessages",
			type:'GET',
			dataType:'JSONP',
			data: {
				room: Chat.currentRoom,
				lastId: Chat.lastMessageId,
			},
			success: function(response){
				console.log('getMessages')
				if (response.result === 'error') {
					console.error('ERROR: ' + response.reason)
				} else if (response.messages.length > 0) {

					// kommentaar

					response.messages.forEach(function(item){
						$('#messages').append('<p id="'+item._id+'"><b>'+item.username+'</b>: '+ item.message +'</p>')
						if ($.inArray(item.username, Chat.usersInRoom) === -1) {
							Chat.usersInRoom.push(item.username)
							$('#users').append('<p>'+item.username+'</p>')
						}
					});
					$('#messages').scrollTop($('#messages')[0].scrollHeight)
					Chat.lastMessageId = response.messages[response.messages.length-1]._id

				}
			}
		});
	},
	'newMessage': function(message) {
		$.ajax({
			url:"chatAPI/newMessage",
			type:'GET',
			dataType:'JSONP',
			data: {
				username: Chat.currentUser,
				userId: localStorage.getItem(Chat.currentUser),
				room: Chat.currentRoom,
				message: message,
			},
			success: function(response){
				console.log('newMessage')
				if (response.result == 'error') {
					error('ERROR: ' + response.reason)
				} else {
					Chat.getMessages()
				}
			}
		});
	},
	startTimer: function() {
		Chat.getMessages()
		setInterval(Chat.getMessages, 1500)
	}
}

error = function(msg) {

	$('#errorbox').append('<p>'+msg+'</p>').fadeOut(5000)
}
