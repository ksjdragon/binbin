import sys, os, time, flask
from flask import Flask
from flask import (render_template, url_for, send_from_directory,
	request, session, redirect)

USERS = {'ksjdragon': 'coolbeans'}

PATHS = {'ksjdragon': {
	'Real': '/var/www/html/binbin',
	#'Virtual': 'vfiles/ksjdragon'
	}
}

app = Flask(__name__)

app.secret_key = open('key.txt', 'rb').read()

@app.route('/')
def index():
	if 'username' in session:
		return render_template('desktop.html')
	else:
		return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
	error = None
	u, p = request.form['username'], request.form['password']
	success = validate_login(u, p)
	if success: 
		session['username'] = u;
		return flask.jsonify(True)
	else:
		return flask.jsonify(False)

@app.route('/logout')
def logout():
	session.pop('username', None);
	return redirect(url_for('index'))

@app.route('/files', methods=['POST'])
def files():
	if 'username' not in session:
		return redirect(url_for('index'))

	want = request.form['dir']
	real_dirs = PATHS[session['username']]['Real']
	info = dir_info(real_dirs+want, 'real')
	#vir_dirs = PATHS[session['username']]['Virtual']
	return flask.jsonify(info)

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

def validate_login(u, p):
	try:
		return USERS[u] == p
	except KeyError:
		return False

def sizeof_fmt(num, suffix='B'):
    for unit in ['','K','M','G','T','P','E','Z']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Y', suffix)

def dir_info(path, t):
	if t == 'real':
		full_items = []
		items = os.listdir(path)
		for item in items:
			stats = list(os.stat(path + "/" + item))
			is_fol = os.path.isdir(path + "/" + item)
			if is_fol:
				full_items.append({
					"folder": True,
					"name": item,
					"date": time.strftime('%Y-%m-%d %H:%M:%S', \
							time.gmtime(stats[8]))
				})
			else:
				
				full_items.append({
					"folder": False,
					"name": item,
					"date": time.strftime('%Y-%m-%d %H:%M:%S', \
							time.gmtime(stats[8])),
					"size": sizeof_fmt(stats[6])
				})
		return full_items

	elif t == 'virtual':
		pass

if __name__ == '__main__':
	app.run(debug=True)