'''
Server-side WaterGem application.

Written for Google App Engine. Persist data to Google Datastore.
'''
import os, webapp2, jinja2, re, hashlib, hmac, random, datetime, json
from datetime import date
import string, ast
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

# define datastore models

class User(ndb.Model):
	''' Datastore model for one app "user"
	'''
	username = ndb.StringProperty(required = True)
	lc_username = ndb.StringProperty(required = True)
	email = ndb.StringProperty(required = True)
	password = ndb.StringProperty(required = True)
	foundgems = ndb.KeyProperty(repeated = True)
	usedgems = ndb.KeyProperty(repeated = True)

class Country(ndb.Model):
	''' Datastore model for one country
	'''
	name = ndb.StringProperty(required = True)
	cities = ndb.KeyProperty(repeated = True)

class City(ndb.Model):
	''' Datastore model for one city
	'''
	name = ndb.StringProperty(required = True)
	country = ndb.KeyProperty(required = True)
	neighborhoods = ndb.KeyProperty(repeated = True)

class Neighborhood(ndb.Model):
	''' Datastore model for one neighborhood
	'''
	name = ndb.StringProperty(required = True)
	city = ndb.KeyProperty(required = True)
	gems = ndb.KeyProperty(repeated = True)


class Gem(ndb.Model):
	''' Datastore model for one gem
	'''
	location = ndb.GeoPtProperty(required = True)
	neighborhood = ndb.KeyProperty(required = True)
	prices = ndb.FloatProperty(repeated = True)
	picture = ndb.BlobProperty()
	uv = ndb.BooleanProperty(required = True)
	ozone = ndb.BooleanProperty(required = True)
	confirmed = ndb.BooleanProperty(required = True)
	company = ndb.StringProperty()
	notes = ndb.StringProperty()
	gemfinder = ndb.KeyProperty()
	gemusers = ndb.KeyProperty(repeated = True)

### initial pop data
LOCALES = {
	"Thailand":
		{"Bangkok":
			{"Phra Nakhon":[],
			 "Dusit":[],
			 "Nong Chok":[],
			 "Bang Rak":[
			 	{
					"location":"13.730723, 100.51499", 
					"picname":"",
					"prices":[],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"Side alley off of Charoen Krung Road with Old Town Hostel at intersection."
				}
			 ],
			 "Bang Khen":[],
			 "Bang Kapi":[],
			 "Pathum Wan":[
			 	{
					"location":"13.736146, 100.52327", 
					"picname":"Bangkok10",
					"prices":[1],
					"company":"[Good Drinks]",
					"uv":False,
					"ozone":True,
					"confirmed":True,
					"notes":"If picture is accurate, please delete this note."
			 	}
			 ],
			 "Pom Prap Sattru Phai":[],
			 "Phra Khanong":[],
			 "Min Buri":[],
			 "Lat Krabang":[],
			 "Yan Nawa":[],
			 "Samphanthawong":[],
			 "Phaya Thai":[
			 	{
					"location":"13.77911, 100.53787", 
					"picname":"Bangkok7",
					"prices":[1],
					"company":"Tomorn Drinking",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
			 	},
				{
					"location":"13.795133, 100.5498", 
					"picname":"Bangkok9",
					"prices":[.75],
					"company":"[Savelife]",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"If picture is accurate, please delete this note."
				}
			 ],
			 "Thon Buri":[],
			 "Bangkok Yai":[],
			 "Huai Khwang":[],
			 "Khlong San":[],
			 "Taling Chan":[],
			 "Bangkok Noi":[],
			 "Bang Khun Thian":[],
			 "Phasi Charoen":[],
			 "Nong Khaem":[],
			 "Rat Burana":[],
			 "Bang Phlat":[],
			 "Din Daeng":[],
			 "Bueng Kum":[],
			 "Sathon":[
			 	{
					"location":"13.718142, 100.52685",
					"picname":"Bangkok17",
					"prices":[],
					"company":"",
					"uv":True,
					"ozone":False,
					"confirmed":True,
					"notes":"West side of the street"
				}
			 ],
			 "Bang Sue":[],
			 "Chatuchak":[],
			 "Bang Kho Laem":[],
			 "Prawet":[],
			 "Khlong Toei":[],
			 "Suan Luang":[],
			 "Chom Thong":[],
			 "Don Mueang":[],
			 "Ratchathewi":[
			 	{
			 		"location":"13.753356, 100.54607",
			 		"picname":"Bangkok1",
			 		"prices":[1,2,5,10],
			 		"company":"[Clearly Pure]",
			 		"uv":False,
			 		"ozone":False,
			 		"confirmed":True,
			 		"notes":""
			 	},
			 	{		
			 		"location":"13.7554083, 100.5420694", 
					"picname":"Bangkok2",
					"prices":[1,5,10],
					"company":"Water Net",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"Side street called Thanon C.S.T. off of Ratchaprarop Road next to Ratchaprarop Kitchen."
				},
				{
					"location":"13.757015, 100.54206", 
					"picname":"Bangkok3",
					"prices":[],
					"company":"JR water",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"Side alley off of Ratchaprarop Road."
				},
				{
					"location":"13.757594, 100.54218", 
					"picname":"Bangkok4",
					"prices":[1],
					"company":"MK Express",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"Side alley off of Ratchaprarop Road."
				},
				{
					"location":"13.758816, 100.54254", 
					"picname":"Bangkok5",
					"prices":[1,5,10],
					"company":"Win Sent",
					"uv":True,
					"ozone":False,
					"confirmed":True,
					"notes":"Side street at intersection of Ratchaprarop Road and Rang Nam Road."
				},
				{
					"location":"13.762113, 100.54044", 
					"picname":"Bangkok6",
					"prices":[1,2,5,10],
					"company":"[TP Group BKK]",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"Left side of driveway of Sabaai Place condos/apartments."
				},
				{
					"location":"13.760931, 100.54316", 
					"picname":"Bangkok8",
					"prices":[],
					"company":"[unknown]",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"North/south side street reachable from Ratchaprarop Road."
				},
				{
					"location":"13.760336, 100.54323", 
					"picname":"",
					"prices":[],
					"company":"[unknown]",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"North/south side street reachable from Ratchaprarop Road."
				},
				{
					"location":"13.759964, 100.54326", 
					"picname":"",
					"prices":[.75],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"North/south side street reachable from Ratchaprarop Road."
				},
				{
					"location":"13.759585, 100.54315", 
					"picname":"",
					"prices":[],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"North/south side street reachable from Ratchaprarop Road."
				},
				{
					"location":"13.75923, 100.54318", 
					"picname":"",
					"prices":[],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"North/south side street reachable from Ratchaprarop Road."
				},
				{
					"location":"13.753386, 100.544264", 
					"picname":"Bangkok13",
					"prices":[1],
					"company":"[YAO WATER]",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"Next to Home Hug Hostel; across from 7/11."
				},
				{
					"location":"13.753019, 100.54371", 
					"picname":"Bangkok14",
					"prices":[1],
					"company":"",
					"uv":False,
					"ozone":True,
					"confirmed":True,
					"notes":"This picture might need to be switched with the picture for the gem a few steps to the south."
				},
				{
					"location":"13.752996, 100.5457", 
					"picname":"Bangkok15",
					"prices":[1],
					"company":"",
					"uv":False,
					"ozone":True,
					"confirmed":True,
					"notes":"Hidden just inside the wall separating a parking lot from the street."
				},
				{
					"location":"13.752804, 100.54365", 
					"picname":"Bangkok16",
					"prices":[1],
					"company":"[Rainbow]",
					"uv":True,
					"ozone":False,
					"confirmed":True,
					"notes":"This picture might need to be switched with the picture for the gem a few steps to the north."
				}
			 ],
			 "Lat Phrao":[],
			 "Watthana":[
			 	{
					"location":"13.743452, 100.58091", 
					"picname":"Bangkok11",
					"prices":[1],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":"On north/south street connecting to Baandon Mosque ferry canal stop."
				},
				{
					"location":"13.743452, 100.58091", 
					"picname":"Bangkok12",
					"prices":[1],
					"company":"[Green PLUS]",
					"uv":True,
					"ozone":False,
					"confirmed":True,
					"notes":"On north/south street connecting to Baandon Mosque ferry canal stop."
				}
			 ],
			 "Bang Khae":[],
			 "Lak Si":[],
			 "Sai Mai":[],
			 "Khan Na Yao":[],
			 "Saphan Sung":[],
			 "Wang Thonglang":[],
			 "Khlong Sam Wa":[],
			 "Bang Na":[],
			 "Thawi Watthana":[],
			 "Thung Khru":[],
			 "Bang Bon":[]
			},
		 "Chiang Mai":
			{"Si Phum":[
				{ 
					"location":"18.79691, 98.983932", 
					"picname":"ChiangMai3",
					"prices":[1,2,5,10],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				},
				{
					"location":"18.796073, 98.985908", 
					"picname":"ChiangMai4",
					"prices":[],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				},
				{
					"country":"Thailand", 
					"city":"Chiang Mai", 
					"neighborhood":"Si Phum", 
					"location":"18.794154, 98.984288", 
					"picname":"ChiangMai9",
					"prices":[.50],
					"company":"[Water Fresh]",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				},
				{
					"country":"Thailand", 
					"city":"Chiang Mai", 
					"neighborhood":"Si Phum", 
					"location":"18.794114, 98.984294", 
					"picname":"ChiangMai10",
					"prices":[1,5,10],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				},
				{
					"country":"Thailand", 
					"city":"Chiang Mai", 
					"neighborhood":"Si Phum", 
					"location":"18.793985, 98.983807", 
					"picname":"ChiangMai11",
					"prices":[.50],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				},
				{
					"country":"Thailand", 
					"city":"Chiang Mai", 
					"neighborhood":"Si Phum", 
					"location":"18.79404, 98.983568", 
					"picname":"ChiangMai12",
					"prices":[.50],
					"company":"[Good Drinks]",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				},
				{
					"country":"Thailand", 
					"city":"Chiang Mai", 
					"neighborhood":"Si Phum", 
					"location":"18.792279, 98.982138", 
					"picname":"ChiangMai13",
					"prices":[.50, 1, 2, 5, 10],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				}
			 ],
			 "Phra Sing":[
			 	{
					"location":"18.784742, 98.988516", 
					"picname":"ChiangMai8",
					"prices":[1],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				}
			 ],
			 "Haiya":[
			 	{
					"location":"18.778776, 98.984087", 
					"picname":"ChiangMai7",
					"prices":[1,2,5,10],
					"company":"[System Technology]",
					"uv":True,
					"ozone":True,
					"confirmed":True,
					"notes":""
				}
			 ],
			 "Chang Moi":[
			 	{
					"location":"18.786477, 99.001771", 
					"picname":"ChiangMai14",
					"prices":[1,2,5,10],
					"company":"[View]",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				}
			 ],
			 "Chang Khlan":[],
			 "Wat Ket":[],
			 "Chang Phueak":[
			 	{ 
					"location":"18.798959, 98.975058", 
					"picname":"ChiangMai15",
					"prices":[1],
					"company":"[fnr-nanowater]",
					"uv":True,
					"ozone":False,
					"confirmed":True,
					"notes":""
				}
			 ],
			 "Suthep":[
			 	{
					"location":"18.801171, 98.963313", 
					"picname":"ChiangMai1",
					"prices":[1],
					"company":"",
					"uv":False,
					"ozone":True,
					"confirmed":True,
					"notes":""
				},
				{
					"location":"18.800649, 98.961743", 
					"picname":"ChiangMai2",
					"prices":[.50],
					"company":"",
					"uv":True,
					"ozone":False,
					"confirmed":True,
					"notes":""
				},
				{ 
					"location":"18.802812, 98.963543", 
					"picname":"ChiangMai5",
					"prices":[.50],
					"company":"",
					"uv":True,
					"ozone":False,
					"confirmed":True,
					"notes":""
				},
				{
					"location":"18.802584, 98.963213", 
					"picname":"ChiangMai6",
					"prices":[.50],
					"company":"",
					"uv":False,
					"ozone":False,
					"confirmed":True,
					"notes":""
				}
			 ],
			 "Mae Hia":[],
			 "Pa Daet":[],
			 "Nong Hoi":[],
			 "Tha Sala":[],
			 "Nong Pa Khrang":[],
			 "Fa Ham":[],
			 "Pa Tan":[],
			 "San Phi Suea":[]
			}
		}
	}

# wiki endings:
# bangkok:
# Chom_Thong_District,_Bangkok
# all others end in _District
# chiang mai:
# Chang_Phueak,_Chiang_Mai
# Pa_Tan_Subdistrict,_Chiang_Mai
# Tha_Sala,_Chiang_Mai
# Pa_Daet,_Chiang_Mai

### helper functions

def ndb_Model_to_Dict(modelInstance):
	''' Override to_dict so can serialize unserializable ndb properties
	(like GeoPtProperty, BlobProperty, and KeyProperty)
	'''
	dict = {}
	properties = None

	if type(modelInstance) is Gem:
		properties = Gem._properties
	elif type(modelInstance) is User:
		properties = User._properties
	elif type(modelInstance) is Country:
		properties = Country._properties
	elif type(modelInstance) is City:
		properties = City._properties
	elif type(modelInstance) is Neighborhood:
		properties = Neighborhood._properties

	for property in properties:

		if getattr(modelInstance, property):

			if type(properties[property]) is ndb.GeoPtProperty:

				dict[property] = str(getattr(modelInstance, property))
			elif type(properties[property]) is ndb.BlobProperty:

				dict[property] = getattr(modelInstance, property).encode('base64')
			elif type(properties[property]) is ndb.KeyProperty:

				thisKeyProperty = getattr(modelInstance, property)
				serializedKeyProperty = None

				if type(thisKeyProperty) is list:

					serializedKeyProperty = []

					for keyModelInstance in thisKeyProperty:
						# guard against nones
						if keyModelInstance:
							keyKind = keyModelInstance.kind()
							keyId = keyModelInstance.id()
							serializedKeyProperty.append(keyKind)
							serializedKeyProperty.append(keyId)
				else:
					# guard against nones
					if thisKeyProperty:
						serializedKeyProperty = thisKeyProperty.pairs()

				dict[property] = serializedKeyProperty
			else:

				dict[property] = getattr(modelInstance, property)
		else:

			dict[property] = None

	# apparently 'key' is not in Model._properties
	thisKey = []
	thisKeyKind = modelInstance.key.kind()
	thisKeyId = modelInstance.key.id()
	thisKey.append(thisKeyKind)
	thisKey.append(thisKeyId)
	dict["key"] = thisKey

	return dict

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
		imgPath = os.getcwd() + "/images/"

		for countryName in LOCALES:

			countryObj = Country(name=countryName, cities=[])
			countryObj.put()

			for cityName in LOCALES[countryName]:

				cityObj = City(name=cityName, country=countryObj.key,
					neighborhoods=[])
				cityObj.put()

				for neighborhoodName in LOCALES[countryName][cityName]:

					neighborhoodObj = Neighborhood(name=neighborhoodName,
						city=cityObj.key, gems=[])
					neighborhoodObj.put()

					for gem in LOCALES[countryName][cityName][neighborhoodName]:

						picture = None
						if gem["picname"]:
							thisImgPath = imgPath + gem["picname"] + ".jpg"
							picture = open(thisImgPath, "rb").read()

						newGem = Gem(location=ndb.GeoPt(gem["location"]), 
							neighborhood=neighborhoodObj.key,
							prices=gem["prices"], uv=gem["uv"],
							ozone=gem["ozone"], confirmed=gem["confirmed"],
							company=gem["company"], notes=gem["notes"],
							gemusers=[], picture=picture)

						newGem.put()
						neighborhoodObj.gems.append(newGem.key)

					neighborhoodObj.put()
					cityObj.neighborhoods.append(neighborhoodObj.key)

				cityObj.put()
				countryObj.cities.append(cityObj.key)

			countryObj.put()
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

		return redirect_to("home")

#
# implement register and user after Udacity project
#
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

#
# implement signin after Udacity project
#
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

		return redirect_to("home")

#
# implement after Udactity project
#
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

		if user.key.id == gem.user.key.id:
			return redirect_to("home")

		gemfinders = pickle.loads(str(gem.gemfinders))
		gems = pickle.loads(str(user.gems))

		if (not user.key.id in gemfinders and 
			not long(id) in gems):

			gem.numGemfinders += 1

			gemfinders[user.key.id] = True
			gem.gemfinders = pickle.dumps(gemfinders)
			gem.put()

			gems[long(id)] = True
			user.gems = pickle.dumps(gems)
			user.put()

		return redirect_to("home")

class About(Handler):
	''' Serve about WaterGem page
	'''
	def get(self):
		''' Handle get request; render about page
		'''
		username = getUserFromSecureCookie(self.request.cookies.get("username"))

		self.render("about.html", username=username)

#
# implement after Udacity project
#
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
class GetGems(Handler):
	''' Handle requests for gems
	'''
	def get(self):

		queryParams = self.request.headers["queryParams"]
		queryDict = {}
		
		gems = Gem.query()
		gems = gems.order(Gem.name)
		properties = Gem._properties

		# filter iteratively
		if queryParams:
			queryDict = ast.literal_eval(queryParams)

			for param in queryDict:

				property = properties[param]
				gems = gems.filter(property = queryDict[param])

		gems = gems.fetch()
		self.response.write(json.\
			dumps([ndb_Model_to_Dict(gem) for gem in gems]))

class GetLocales(Handler):
	''' Handle requests for all kinds of locales
	'''
	def get(self):

		kind = self.request.headers["Kind"]
		queryParams = self.request.headers["Queryparams"]
		queryDict = {}
		properties = None
		locales = None

		# get all of relevant locales
		if kind == "country":

			locales = Country.query()
			locales.order(Country.name)
			properties = Country._properties
		elif kind == "city":

			locales = City.query()
			locales.order(City.name)
			properties = City._properties
		elif kind == "neighborhood":

			locales = Neighborhood.query()
			locales.order(Neighborhood.name)
			properties = Neighborhood._properties

		# iteratively filter results if params provided
		if queryParams:

			queryDict = ast.literal_eval(queryParams)

			for param in queryParams:

				locales = locales.filter(param = queryDict[param])

		locales = locales.fetch()
		self.response.write(json.\
			dumps([ndb_Model_to_Dict(locale) for locale in locales]))

class GetInstanceByKey(Handler):
	''' Handle requests to get datastore entity by key
	Theoretically should automatically use memcache if entity already queried
	'''
	def get(self):

		keyArray = self.request.headers["key"].split(",")
		key = ndb.Key(keyArray[0], int(keyArray[1]))

		entity = key.get()

		if entity:
			self.response.write(json.dumps(ndb_Model_to_Dict(entity)))
		else:
			self.response.write(None)


app = webapp2.WSGIApplication(
		[webapp2.Route("/home", handler=Home, name="index"),
		 webapp2.Route("/about", handler=About, name="about"),
		 webapp2.Route("/register", handler=Register, name="register"),
		 webapp2.Route("/signin", handler=Signin, name="signin"),
		 webapp2.Route("/logout", handler=Logout, name="logout"),
		 webapp2.Route("/gem/like/<id>", handler=UseGem, name="usegem"),
		 webapp2.Route("/gem/edit/<id>", handler=EditGem, name="editgem"),
		 webapp2.Route("/gem/new", handler=NewGem, name="newgem"),
		 webapp2.Route("/GetGems", handler=GetGems, name="getgems"),
		 webapp2.Route("/GetLocales", handler=GetLocales, name="getlocales"),
		 webapp2.Route("/GetByKey", handler=GetInstanceByKey, 
		 	name="getinstancebykey")],
		debug=True)


