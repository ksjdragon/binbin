import sys, os, time, hashlib, uuid, threading, atexit, flask, \
	configparser as cp
from flask import Flask, render_template, url_for, request, session, \
	send_from_directory, send_file, redirect
from flask_pymongo import PyMongo, ObjectId

FILTERS = {
	'name': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
				'0123456789_',
	'path': ['../', './']
}

def apply_config():
	config = cp.ConfigParser()
	config.read('config.ini')
	for k,v in config['Settings'].items():
		k = k.upper()
		if k == 'KEY_FILE':
			app.secret_key = open(v, 'rb').read()
		elif k == 'DEFAULT_VIRTUAL_SIZE':
			app.config[k] = int(v)
		else:
			app.config[k] = v


os.chdir(os.path.dirname(__file__))

app = Flask(__name__)
apply_config()
mongo = PyMongo(app)
USERS, DRIVES, LINKS = mongo.db['users'], mongo.db['drives'], \
		mongo.db['links']

CHECK_PERIOD = 60
expire_thread = threading.Thread()

@app.route('/')
def index():
	if 'username' in session:
		return render_template('pre_main.html')
	else:
		return render_template('index.html')

@app.route('/main/<method>')
def main(method):
	return render_template(method+'.html')

@app.route('/login', methods=['POST'])
def login():
	error = None
	u, p = request.form['username'], request.form['password']
	success = validate_login(u, p)
	if success: 
		session['username'] = u
		return flask.jsonify(True)
	else:
		return flask.jsonify(False)

@app.route('/logout')
def logout():
	session.pop('username', None)
	return redirect(url_for('index'))

@app.route('/mydrives')
def mydrives():
	if 'username' not in session:
		return redirect(url_for('index'))

	user_id = get_user(session)['_id']
	owned = DRIVES.find({'owner': user_id})
	shared = DRIVES.find({'shared_read': {'$in': [user_id]}})

	info = {'owned': [], 'shared': []}

	for drive in owned:
		drive_info = {
			'_id': str(drive['_id']),
			'name': drive['name'],
			'size': drive['size'],
			'public_read': drive['public_read'],
			'public_write': drive['public_write'],
			'shared_read': [str(i) for i in drive['shared_read']],
			'shared_write': [str(i) for i in drive['shared_write']]
		}
		info['owned'].append(drive_info)

	for drive in shared:
		drive_info = {
			'_id': str(drive['_id']),
			'name': drive['name'],
			'size': drive['size']
		}
		info['shared'].append(drive_info)

	return flask.jsonify(info)

@app.route('/files', methods=['POST'])
def files():
	check = verify_data('files', request.form, session)
	if not check[0]: return check[1]
	form = check[1]

	if form['is_fol']:	# If request is a folder.
		info = dir_info(form['path'], form['drive']['type'], \
				form['drive']['_id'])
		return flask.jsonify(info)
	else:		# If request is a file.
		if form['drive']['type'] == 'real':
			link = LINKS.insert_one({
				'path': form['path'],
				'name': form['path'].split("/")[-1],
				'shared': [get_user(session)['_id']],
				'expiry': -1
			}).inserted_id
		elif form['drive']['type'] == 'virtual':
			r_path = form['drive']['path'] + '/' + form['real_file']
			link = LINKS.insert_one({
				'path': r_path,
				'name': form['path'].split("/")[-1],
				'shared': [get_user(session)['_id']],
				'expiry': -1
			}).inserted_id
		else: 
			raise Exception("Invalid method for file link creation.")
		### QUEUE DELETION
		return str(link)


@app.route('/d/<_id>')
def download(_id):
	if 'username' not in session:
		return redirect(url_for('index'))

	try:
		link = LINKS.find_one({'_id': ObjectId(_id)})
	except:
		return redirect(url_for('index'))

	if link == None: return redirect(url_for('index'))
	if get_user(session)['_id'] not in link['shared']:
		return redirect(url_for('index'))
	else:
		if link['expiry'] == -1: 
			LINKS.delete_one({'_id': ObjectId(_id)})
		return send_file(link['path'], as_attachment=True,
			attachment_filename=link['name'])
	

@app.route('/users/<method>', methods=['POST'])
def users(method):
	if 'username' not in session:
		return redirect(url_for('index'))

	user = USERS.find_one({'username': session['username']})

	if method == 'create':
		check = verify_data('users.create', request.form, session)
		if not check[0]: return check[1]
		form = check[1]

		salt = uuid.uuid4().hex
		to_hash = (form['password'] + salt).encode('utf-8')
		user = USERS.insert_one({
			'username': form['username'],
			'password': hashlib.sha512(to_hash).digest(),
			'salt': salt,
			'perm_level': 1
		})

		create_drive('virtual', user.inserted_id)

	elif method == 'delete':
		check = verify_data('users.delete', request.form, session)
		if not check[0]: return check[1]
		form = check[1]
		USERS.delete_one({'username': form['username']})

	elif method == 'modify':
		pass
	return 'Operation completed'

@app.route('/drive/<drive_id>/<path:path>')
def drive_path():
	pass

@app.errorhandler(404)
def page_not_found(e):
	return render_template('404.html'), 404


# Temporary for development:
@app.route('/css/<path:path>')
def css(path):
	return send_from_directory('css', path)

@app.route('/js/<path:path>')
def js(path):
	return send_from_directory('js', path)

@app.route('/assets/<path:path>')
def assets(path):
	return send_from_directory('assets', path)

# End temporary

def get_user(sess):
	return USERS.find_one({'username': session['username']})


def validate_login(u, p):
	user = USERS.find_one({'username': u})
	if user == None:
		return False
	else:
		to_hash = (p + user['salt']).encode('utf-8')
		return hashlib.sha512(to_hash).digest() == user['password']


def sizeof_fmt(num, suffix='B'):
    for unit in ['','K','M','G','T','P','E','Z']:
        if abs(num) < 1024.0:
            return '%3.1f%s%s' % (num, unit, suffix)
        num /= 1024.0
    return '%.1f%s%s' % (num, 'Y', suffix)


def dir_info(path, t, drive_id):
	def info_dict(item, stats, is_fol):
		if is_fol:
			my_item = ({
				'folder': True,
				'name': item
			})
		else:
			my_item = ({
				'folder': False,
				'name': item,
				'date': time.strftime('%Y-%m-%d %H:%M:%S UTC', \
						time.gmtime(stats[8])),
				'size': sizeof_fmt(stats[6]),
				'real_size': stats[6]
			})
		return my_item
	full_items = []

	if t == 'real':
		items = os.listdir(path)
		for item in items:
			stats = list(os.stat(path + '/' + item))
			is_fol = os.path.isdir(path + '/' + item)
			full_items.append(info_dict(item, stats, is_fol))

	elif t == 'virtual':
		drives = DRIVES.find_one({'_id': drive_id})
		tree = drives['tree']
		path = path.replace('.',':').split("/")[1:]
		if path != []: 
			for sub in path: tree = tree[sub]

		for k,v in tree.items():
			is_fol = type(v).__name__ != 'str'
			if is_fol: 
				stats = None
			else:
				stats = list(os.stat(drives['path'] + '/' + v))
			full_items.append(info_dict(k.replace(':','.'), \
										stats, is_fol))

	return full_items


def exists(data, need):
	try:
		[i in data for i in need].index(False)
		return False
	except ValueError:
		return True


def sanitize(d):
	if 'username' in d:
		s = ''
		for c in d['username']: s += c if c in FILTERS['name'] else ''
		d['username'] = s

	if 'path' in d:
		for s in FILTERS['path']:
			if s in d['path']:
				d['path'] = ''


def sess_is_user(sess, name):
	return sess['username'] == name


def sess_is_admin(sess):
	return get_user(sess)['perm_level'] == 100


def copy_dict(form):
	new_form = {}
	for k,v in form.items(): new_form[k] = v
	return new_form


def verify_data(method, form, sess):
	'''
	Verifies permissions and format and sanitizes user input.
	For each method, 1) Check for malformed data. 3) Check permissions
	for operation based on session. 3) Sanitize data. 4) Check 
	operation specific requirements. 
	'''

	err_msgs = {
		'data': 'malformed data',
		'permission': 'insufficient permissions',
		'userexists': 'username already in use',
		'driveperm': 'the drive is not shared with you',
		'pathinvalid': 'not a valid path'
	}

	errors = []
	data = copy_dict(form)
	if method == 'users.create':
		has_items = exists(data, ['username', 'password'])
		if not has_items: errors.append('data')
		if not sess_is_admin(sess): errors.append('permission')

		sanitize(data)

		try:
			if USERS.find_one({'username': data['username']}) != None:
				errors.append('userexists')
		except KeyError:
			pass


	elif method == 'users.delete':
		has_items = exists(data, ['username'])
		if not has_items: errors.append('data')
		if not sess_is_admin(sess) and \
			not sess_is_user(sess, data['username']):
			return errors.append('permission')

		sanitize(data)
	
	elif method == 'users.modify':
		pass

	elif method == 'files':
		has_items = exists(data, ['drive_id', 'path'])
		if not has_items: errors.append('data')

		drive = DRIVES.find_one({'_id': ObjectId(data['drive_id'])})
		if drive == None: errors.append('driveinvalid')

		if not drive['public_read']:
			user_id = get_user(sess)['_id']
			if user_id != drive['owner'] and \
				user_id not in drive['shared_read']:
				errors.append('driveperm')

		sanitize(data)

		if drive['type'] == 'real':
			if not os.path.exists(drive['path'] + data['path']):
				errors.append('pathinvalid')
			data['is_fol'] = os.path.isdir(drive['path'] + \
												data['path'])
			
			# For real drives, the path is kept as the full real path.
			data['path'] = drive['path']+data['path']
		elif drive['type'] == 'virtual':
			tree = drive['tree']
			path = data['path'].replace('.',':').split('/')[1:]
			if path != []:
				folder, f = path[:-1], path[-1]
				try:
					for sub in folder: tree = tree[sub]
					data['is_fol'] = type(tree[f]).__name__ != 'str'
					data['real_file'] = tree[f]
				except KeyError:
					errors.append('pathinvalid')
			else:
				data['is_fol'] = True

			# For virtual drives, the path is just the user request.
		
		data['drive'] = drive
		
	else:
		raise Exception('Invalid data verification method.')

	if len(errors) == 0: return [True, data]

	msg = 'Error: '
	for i,e in enumerate(errors):
		if len(errors) == 1:
			msg += err_msgs[e][0].upper() + err_msgs[e][1:]
		elif i == 0:
			msg += err_msgs[e][0].upper() + err_msgs[e][1:] + ', '
		elif i == len(errors)-1:
			msg += 'and ' + err_msgs[e]
		else:
			msg += err_msgs[e] + ', '
	msg += '.'

	if len(errors) <= 2: msg = msg.replace(',', '')

	return [False, msg]


def create_drive(method, owner, form=None):
	if method == 'real':
		DRIVES.insert_one({
			'name': form['name'],
			'path': form['path'],
			'type': 'real',
			'owner': owner,
			'public_read': False,
			'public_write': False,
			'shared_read': [],
			'shared_write': []
		})
	elif method == 'virtual':
		vir_path = app.config['VIRTUAL_DB_PATH'] + "/" + str(owner)
		name = str(uuid.uuid4())+str(uuid.uuid4())
		DRIVES.insert_one({
			'name': 'My Drive',
			'path': vir_path,
			'tree': {
				'Welcome:txt': name
			},
			'type': 'virtual',
			'size': app.config['DEFAULT_VIRTUAL_SIZE'],
			'owner': owner,
			'public_read': False,
			'public_write': False,
			'shared_read': [],
			'shared_write': []
		})

		os.mkdir(vir_path)
		file = open(vir_path+'/'+name, 'w')
		file.write(app.config['WELCOME_MSG'])
		file.close()

	else:
		raise Exception('Invalid drive creation method.')

	return 'Operation completed.'


def manage_expiry():
	links = LINKS.find()
	#print(links)



if __name__ == '__main__':
	app.run(debug=True)