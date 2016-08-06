'''
Server-side WaterGem application.

Written for Google App Engine. Persist data to Google Datastore.
'''
import os, webapp2, jinja2, re, hashlib, hmac, random, datetime, json
from datetime import date
import string, cPickle as pickle
from webapp2 import redirect_to
from google.appengine.ext import ndb

# third party lib
import bleach

template_dir = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = jinja2.Environment(loader=jinja2.FileSystemLoader(template_dir),
	autoescape=True, auto_reload=True)
jinja_env.globals['url_for'] = webapp2.uri_for


class Handler(webapp2.RequestHandler):
	''' Handle HTTP requests and serve appropriate pages/code
	'''
	def write(self, *a, **kw):
		''' Write a response
		'''
		self.response.out.write(*a, **kw)

	def render_str(self, template, **params):
		''' Render a jinja template
		'''
		t = jinja_env.get_template(template)
		return t.render(params)

	def render(self, template, **kw):
		''' Render a jinja template to browser by writing it to response
		'''
		self.write(self.render_str(template, **kw))

## need to refactor this for modules
# define entities
# question: after udacity should i ditch datastore in favor of free RDB?

class User(db.Model):
	''' Datastore model for one app "user"
	'''
	username = ndb.StringProperty(required = True)
	lc_username = ndb.StringProperty(required = True)
	email = ndb.Email(required = True)
	password = ndb.StringProperty()

# a specific user's unique dreamsigns
class Gem(db.Model):
	''' Datastore model for one gem
	'''
	location = ndb.GeoPoint(required = True)
	country = ndb.StringProperty(required = True)
	city = ndb.StringProperty(required = True)
	neighborhood = ndb.StringProperty(required = True)
	prices = ndb.StringProperty()
	picture = ndb.Blob()
	notes = ndb.StringProperty()
	gemfinder = ndb.ReferenceProperty("User", "foundgems")
	gemfinders = ndb.ReferenceProperty("User", "gemfinders")


### some globals

COUNTRIES = []
CITIES = []
NEIGHBORHOODS = []

### helper functions

def make_salt():
	''' Create salt for a hashed password
	'''
	return ''.join(random.choice(string.letters) for x in xrange(5))

def make_pw_hash(name, pw, salt=None):
	''' Create a salted hash for a password
	'''
	if not salt:
		salt = make_salt()
	h = hashlib.sha256(name + pw + salt).hexdigest()
	return '%s,%s' % (h, salt)

def correct_pw(name, pw, h):
	''' Check if given password matches the hashed password for a user
	'''
	salt = h.split(",")[1]
	return h == make_pw_hash(name, pw, salt)

# set signin regexes and validators
USER_RE = re.compile(r"^[a-zA-Z0-9_-]{3,20}$")
def valid_username(username):
	''' Determine whether valid username
	'''
	return USER_RE.match(username)

SPECIAL_CHAR_RE = re.compile(r"[\!@\#\$%\^&\*]")
NUMBER_RE = re.compile(r"[0-9]")
LOWER_CASE_RE = re.compile(r"[a-z]")
UPPER_CASE_RE = re.compile(r"[A-Z]")
def valid_password(password):
	''' Determine whether valid password
	'''

	if len(password) < 6:
		return False

	if len(password) > 20:
		return False

	if not SPECIAL_CHAR_RE.search(password):
		return False

	if not NUMBER_RE.search(password):
		return False

	if not LOWER_CASE_RE.search(password):
		return False

	if not UPPER_CASE_RE.search(password):
		return False

	return True

EMAIL_RE = re.compile(r"^[\S]+@[\S]+.[\S]+$")
def valid_email(email):
	''' Determine whether valid email
	'''
	return EMAIL_RE.match(email)

SECRET = 'examplesecret'

def hash_str(s):
	''' Return string hashed with a secret
	'''
	return hmac.new(SECRET, s).hexdigest()

def make_secure_val(s):
	''' Create secure value from a string to hash(string+secret)
	'''
	return "%s|%s" % (s, hash_str(s))

# allows for '|' in the value
def check_secure_val(h):
	''' Check if a value holds a string and hash(string+secret)
	Would mean this value is (basically) 
	secure if we know we kept the secret between us and client/user
	'''
	li = h.split("|")
	HASH = li[len(li)-1]
	s = ""

	for x in range(len(li)-1):
		s += li[x]

		if x < (len(li)-2):
			s += "|"

	if hash_str(s) == HASH:
		return s
	else:
		return None

def getUserFromSecureCookie(username_cookie_val):
	''' Check if "user logged in" cookie is secure
	'''
	username = None

	if username_cookie_val:
		username_cookie_val = check_secure_val(username_cookie_val)
		if username_cookie_val:
			username = username_cookie_val

	return username

# define template servers
class Home(Handler):
	''' Serve the homepage
	'''
	def get(self):
		''' Respond to get request and render the homepage
		'''
		username = getUserFromSecureCookie(self.request.\
			cookies.get("username"))

		'''
		#
		# only do after datastore clear to re-populate defaults
		#
		'''

		'''
		pass all relevant data to to browser
		'''
		self.render("home.html", username=username)

class NewGem(Handler):
	''' Serve form to add a new Gem
	'''
	def get(self):
		''' Respond to get request and render the new Gem form
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))

		if not username:
			return redirect_to("signin")

		user = User.all().filter("username =", username).get()

		self.render("newgem.html", username=username)

	def post(self):
		''' Respond to post request and either create a gem and redirect
		to view the gem, or, if there is a problem, re-render the
		form with all input still in place and messages indicating 
		if the input is valid or not
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))

		if not username:
			return redirect_to("signin")

		users = User.all()
		users.filter("username =", username)
		user = users.get()

		gemDict = {}
		messages = {}

		gemDict["user"] = user
		messages["user"] = {"message": "User OK",
						    "validity": "valid"}

		'''
		gemDict["value"] = bleach.clean(self.request.get("value"))

		if gemDict["value"]:

			validate
		else:
			messages["value"] = {"message": 
				"Please provide value",
				"validity": "invalid"}		

		for attr in gemDict:
			if attr in messages:
				if messages[attr]["validity"] == "invalid":
					return self.render("newdream.html", gemDict=gemDict, 
						messages=messages, username=username)
		
		# set values for datastore (some cannot be string)

		# set the "point in time" user variables for this dream
		gemDict["user_property"] = user.property
		'''

		gem = Gem(**gemDict)
		gem.put()

		return redirect_to("viewgem", id=str(gem.key().id()))

class Register(Handler):
	''' Serve form for registering a new user
	'''
	def get(self):
		''' Handle get request and render register form
		'''
		'''
		redirect to homepage if signed in
		'''
		# countries = sorted(COUNTRIES, key=lambda s: s.lower())
		username = getUserFromSecureCookie(self.request.cookies.get("username"))

		if username:
			return redirect_to("home")

		self.render("register.html", countries=countries, 
			values=None, messages=None)

	def post(self):
		''' Handle post request and create new user, redirecting to home page.
		If there is a problem, re-render form with all input still in place
		and messages to user about input validity.
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))

		if username:
			return redirect_to("home")

		userDict = {}
		messages = {}

		'''
		userDict["value"] = bleach.clean(self.request.get("value"))

		if userDict["value"]:

			validate
		else:
			messages["value"] = {"message": 
				"Please provide value",
				"validity": "invalid"}		

		for attr in userDict:
			if attr in messages:
				if messages[attr]["validity"] == "invalid":
					return self.render("newdream.html", userDict=userDict, 
						messages=messages, username=username)
		
		# set values for datastore (some cannot be string)

		# set the "point in time" user variables for this dream
		userDict["user_property"] = user.property

		if hasInvalid:

			# countries = sorted(COUNTRIES, key=lambda s: s.lower())

			return self.render("register.html", countries=countries,
				userDict=userDict, messages=messages)

		# prepare arguments for User constructor
		userDict.pop("verifypassword", None)
		userDict["password"] = saltedpasshash

		userDict["lc_username"] = userDict["username"].lower()

		user = User(**userDict)
		user.put()

		# if more than one with this email or user name, delete this one
		# and return invalid.  datastore support for unique entity values is not intuitive
		duplicate = False

		users = User.all()
		users.filter("username =", user.username)
		numSameUsername = 0
		for u in users.run():
			numSameUsername += 1
			if numSameUsername > 1:
				messages["username"] = {"message": "Name already taken",
									"validity": "invalid"}
				user.delete()
				duplicate = True
				break

		users = User.all()
		users.filter("email =", user.email)
		numSameEmail = 0
		for u in users.run():
			numSameEmail += 1
			if numSameEmail > 1:
				messages["email"] = {"message": "Email already in use",
									 "validity": "invalid"}
				user.delete()
				duplicate = True
				break

		if duplicate:

			# countries = sorted(COUNTRIES, key=lambda s: s.lower())

			return self.render("register.html", countries=countries,
				userDict=userDict, messages=messages)

		username_cookie_val = make_secure_val(user.username)
		'''

		response = redirect_to("home")

		'''
		response.set_cookie("username", username_cookie_val)
		'''
		return response

class Signin(Handler):
	''' Serve signin page
	'''
	def get(self):
		''' Handle get request and render form to sign in
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))

		if username:
			return redirect_to("home")

		self.render("signin.html", values=None, messages=None, username=None)

	def post(self):
		''' Handle post request, signing user in and redirecting to homepage
		if successful and re-rendering sign-in page with validitiy messages
		if unsuccessful.
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))

		if username:
			return redirect_to("home")

		name = bleach.clean(self.request.get("name"))
		password = bleach.clean(self.request.get("password"))

		# holds message for user about input and 
		# whether input is valid or invalid
		messages = {}

		if name:
			users = User.all()
			users.filter("username =", name)
			user = users.get()
			if user:
				messages["name"] = {"message": "",
							 		"validity": "valid"}
				if password:
					saltedpasshash = user.password
					if correct_pw(user.username, password, saltedpasshash):
						messages["password"] = {"message": "",
									 		    "validity": "valid"}
					else:
						messages["password"] = {"message": "Password incorrect",
				 							    "validity": "invalid"}	
				else:
						messages["password"] = {"message": "Enter password",
				 							    "validity": "invalid"}	
			else:
				messages["name"] = {"message": "Username does not exist",
									"validity": "invalid"}	
				messages["password"] = {"message": "",
									    "validity": "invalid"}
		else:
			messages["name"] = {"message": "Please provide a name",
								"validity": "invalid"}
			messages["password"] = {"message": "",
								    "validity": "invalid"}

		values = {}
		values["name"] = name
		values["password"] = password

		for field in messages:
			if messages[field]["validity"] == "invalid":
				return self.render("signin.html", values=values, 
					messages=messages, username=None)


		username_cookie_val = make_secure_val(user.username)

		response = redirect_to("home")
		response.set_cookie("username", username_cookie_val)
		return response

class ViewGem(Handler):
	''' Need this?
	'''

class EditGem(Handler):
	''' Serve form to edit a specific gem
	'''
	def get(self, id=None):
		''' Handle get request; render form.
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))
		gem = Gem.get_by_id(int(id))

		if not username:
			return redirect_to("signin")
		elif username != dream.user.username:
			return redirect_to("home")

		self.render("editgem.html", gem=gem, Dict=None, 
			username=username)

	def post(self, id=None):
		''' Handle post request; redirect to view the dream with changes if 
		successful, re-render form with validity messages if unsuccessful.
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))
		dream = Dream.get_by_id(int(id))

		if not username:
			return redirect_to("signin")
		elif username != dream.user.username:
			return redirect_to("home", page=1)

		'''
		Same validation as new gem except for only editable parts
		gem.edited_property = gemDict["edited_property"]
		gem.put()
		'''

		return redirect_to("viewgem", id=id)

class DeleteDream(Handler):
	''' Serve form to delete a dream
	'''
	'''
	Probably do not need this -- should be handled by flagging by users, if too many
	flag as not exist render differently, then admins can do periodic maintenance to remove
	'''

class UseGem(Handler):
	''' Handle requests related to "use" (like) a gem
	'''
	def get(self, id=None):
		''' Handle get request; increase "uses" if appropriate or re-direct
		or do nothing if not appropriate
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))
		users = User.all()
		user = users.filter("username =", username).get()

		gem = Dream.get_by_id(int(id))

		if not username:
			return redirect_to("signin")

		if user.key().id() == gem.user.key().id():
			return redirect_to("viewgem", id=id)

		gemfinders = pickle.loads(str(gem.gemfinders))
		gems = pickle.loads(str(user.gems))

		if (not user.key().id() in gemfinders and 
			not long(id) in gems):

			gem.numGemfinders += 1

			gemfinders[user.key().id()] = True
			gem.gemfinders = pickle.dumps(gemfinders)
			gem.put()

			gems[long(id)] = True
			user.gems = pickle.dumps(gems)
			user.put()

		return redirect_to("viewgem", id=id)

class About(Handler):
	''' Serve about WaterGem page
	'''
	def get(self):
		''' Handle get request; render about page
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))

		self.render("about.html", username=username)

class Logout(Handler):
	''' Handle requests related to logging out
	'''
	def get(self):
		''' Handle get request; redirect to signin page, delete signin cookie
		'''
		response = redirect_to("signin")
		response.set_cookie("username", "")
		return response

# Ajax handlers
#empty

app = webapp2.WSGIApplication(
		[webapp2.Route("/home", handler=Home, name="index"),
		 webapp2.Route("/home/<page>", handler=Home, name="home"),
		 webapp2.Route("/about", handler=About, name="about"),
		 webapp2.Route("/register", handler=Register, name="register"),
		 webapp2.Route("/signin", handler=Signin, name="signin"),
		 webapp2.Route("/logout", handler=Logout, name="logout"),
		 webapp2.Route("/gem/view/<id>", 
		 	handler=ViewGem, name="viewgem"),
		 webapp2.Route("/gem/like/<id>", 
		 	handler=UseGem, name="usegem"),
		 webapp2.Route("/gem/edit/<id>", 
		 	handler=EditGem, name="editgem"),
		 webapp2.Route("/gem/new", handler=NewGem, name="newgem")],
		debug=True)


