//+------------------------------------------------------------------ß
//|                                                            JAson |
//|    This software is licensed under the MIT https://goo.gl/eyJgHe |
//+------------------------------------------------------------------+
#property copyright "Copyright © 2006-2017"
#property version "1.12"
#property strict

//------------------------------------------------------------------	enum JSONType
enum JSONType { JSUndef, JSNull, JSBoolean, JSNumber, JSFloat, JSString, JSArray, JSObject };

//------------------------------------------------------------------	class JSON
class JSON
{
public:
	virtual void Clear(JSONType jt=JSUndef, bool savekey=false) { m_parent=NULL; if (!savekey) m_key=""; m_type=jt; m_bv=false; m_iv=0; m_dv=0; m_prec=8; m_sv=""; ArrayResize(m_e, 0, 100); }
	virtual bool Copy(const JSON &a) { m_key=a.m_key; CopyData(a); return true; }
	virtual void CopyData(const JSON& a) { m_type=a.m_type; m_bv=a.m_bv; m_iv=a.m_iv; m_dv=a.m_dv; m_prec=a.m_prec; m_sv=a.m_sv; CopyArr(a); }
	virtual void CopyArr(const JSON& a) { int n=ArrayResize(m_e, ArraySize(a.m_e)); for (int i=0; i<n; i++) { m_e[i]=a.m_e[i]; m_e[i].m_parent=GetPointer(this); } }
	
public:
	JSON m_e[];
	string m_key;
	string m_lkey;
	JSON* m_parent;
	JSONType m_type;
	bool m_bv;
	long m_iv;
	double m_dv; int m_prec;
	string m_sv;
	static int code_page;
	
public:
	JSON() { Clear(); }
	JSON(JSON* aparent, JSONType atype) { Clear(); m_type=atype; m_parent=aparent; }
	JSON(JSONType t, string a) { Clear(); FromStr(t, a); }
	JSON(const int a) { Clear(); m_type=JSNumber; m_iv=a; m_dv=(double)m_iv; m_sv=IntegerToString(m_iv); m_bv=m_iv!=0; }
	JSON(const long a) { Clear(); m_type=JSNumber; m_iv=a; m_dv=(double)m_iv; m_sv=IntegerToString(m_iv); m_bv=m_iv!=0; }
	JSON(const double a, int aprec=-100) { Clear(); m_type=JSFloat; m_dv=a; if (aprec>-100) m_prec=aprec; m_iv=(long)m_dv; m_sv=DoubleToString(m_dv, m_prec); m_bv=m_iv!=0; }
	JSON(const bool a) { Clear(); m_type=JSBoolean; m_bv=a; m_iv=m_bv; m_dv=m_bv; m_sv=IntegerToString(m_iv); }
	JSON(const JSON& a) { Clear(); Copy(a); }
	~JSON() { Clear(); }
	
public:
	int Size() { return ArraySize(m_e); }
	virtual bool IsNumeric() { return m_type==JSFloat || m_type==JSNumber; }
	virtual JSON* FindKey(string akey) { for (int i=Size()-1; i>=0; --i) if (m_e[i].m_key==akey) return GetPointer(m_e[i]); return NULL; }
	virtual JSON* HasKey(string akey, JSONType atype=JSUndef) { JSON* e=FindKey(akey); if (CheckPointer(e)!=POINTER_INVALID) { if (atype==JSUndef || atype==e.m_type) return GetPointer(e); } return NULL; }
	virtual JSON* operator[](string akey);
	virtual JSON* operator[](int i);
	void operator=(const JSON &a) { Copy(a); }
	void operator=(const int a) { m_type=JSNumber; m_iv=a; m_dv=(double)m_iv; m_bv=m_iv!=0; }
	void operator=(const long a) { m_type=JSNumber; m_iv=a; m_dv=(double)m_iv; m_bv=m_iv!=0; }
	void operator=(const double a) { m_type=JSFloat; m_dv=a; m_iv=(long)m_dv; m_bv=m_iv!=0; }
	void operator=(const bool a) { m_type=JSBoolean; m_bv=a; m_iv=(long)m_bv; m_dv=(double)m_bv; }
	void operator=(string a) { m_type=(a!=NULL)?JSString:JSNull; m_sv=a; m_iv=StringToInteger(m_sv); m_dv=StringToDouble(m_sv); m_bv=a!=NULL; }

	bool operator==(const int a) { return m_iv==a; }
	bool operator==(const long a) { return m_iv==a; }
	bool operator==(const double a) { return m_dv==a; }
	bool operator==(const bool a) { return m_bv==a; }
	bool operator==(string a) { return m_sv==a; }
	
	bool operator!=(const int a) { return m_iv!=a; }
	bool operator!=(const long a) { return m_iv!=a; }
	bool operator!=(const double a) { return m_dv!=a; }
	bool operator!=(const bool a) { return m_bv!=a; }
	bool operator!=(string a) { return m_sv!=a; }

	long ToInt() const { return m_iv; }
	double ToDbl() const { return m_dv; }
	bool ToBool() const { return m_bv; }
	string ToStr() { return m_sv; }

	virtual void FromStr(JSONType t, string a)
	{
		m_type=t;
		switch (m_type)
		{
		case JSBoolean: m_bv=(StringToInteger(a)!=0); m_iv=(long)m_bv; m_dv=(double)m_bv; m_sv=a; break;
		case JSNumber: m_iv=StringToInteger(a); m_dv=(double)m_iv; m_sv=a; m_bv=m_iv!=0; break;
		case JSFloat: m_dv=StringToDouble(a); m_iv=(long)m_dv; m_sv=a; m_bv=m_iv!=0; break;
		case JSString: m_sv=Unescape(a); m_type=(m_sv!=NULL)?JSString:JSNull; m_iv=StringToInteger(m_sv); m_dv=StringToDouble(m_sv); m_bv=m_sv!=NULL; break;
		}
	}
	virtual string GetStr(char& js[], int i, int slen) { if (slen==0) return ""; char cc[]; ArrayCopy(cc, js, 0, i, slen); return CharArrayToString(cc, 0, WHOLE_ARRAY, JSON::code_page); }

	virtual void Set(const JSON& a) { if (m_type==JSUndef) m_type=JSObject; CopyData(a); }
	virtual void Set(const JSON& list[]);
	virtual JSON* Add(const JSON& item) { if (m_type==JSUndef) m_type=JSArray; /*ASSERT(m_type==JSObject || m_type==JSArray);*/ return AddBase(item); } // добавление
	virtual JSON* Add(const int a) { JSON item(a); return Add(item); }
	virtual JSON* Add(const long a) { JSON item(a); return Add(item); }
	virtual JSON* Add(const double a, int aprec=-2) { JSON item(a, aprec); return Add(item); }
	virtual JSON* Add(const bool a) { JSON item(a); return Add(item); }
	virtual JSON* Add(string a) { JSON item(JSString, a); return Add(item); }
	virtual JSON* AddBase(const JSON &item) { int c=Size(); ArrayResize(m_e, c+1, 100); m_e[c]=item; m_e[c].m_parent=GetPointer(this); return GetPointer(m_e[c]); } // добавление
	virtual JSON* New() { if (m_type==JSUndef) m_type=JSArray; /*ASSERT(m_type==JSObject || m_type==JSArray);*/ return NewBase(); } // добавление
	virtual JSON* NewBase() { int c=Size(); ArrayResize(m_e, c+1, 100); return GetPointer(m_e[c]); } // добавление

	virtual string Escape(string a);
	virtual string Unescape(string a);
public:
	virtual void Serialize(string &js, bool bf=false, bool bcoma=false);
	virtual string Serialize() { string js; Serialize(js); return js; }
	virtual bool Deserialize(char& js[], int slen, int &i);
	virtual bool ExtrStr(char& js[], int slen, int &i);
	virtual bool Deserialize(string js, int acp=CP_ACP) { int i=0; Clear(); JSON::code_page=acp; char arr[]; int slen=StringToCharArray(js, arr, 0, WHOLE_ARRAY, JSON::code_page); return Deserialize(arr, slen, i); }
	virtual bool Deserialize(char& js[], int acp=CP_ACP) { int i=0; Clear(); JSON::code_page=acp; return Deserialize(js, ArraySize(js), i); }
};

int JSON::code_page=CP_ACP;

//------------------------------------------------------------------	operator[]
JSON* JSON::operator[](string akey) { if (m_type==JSUndef) m_type=JSObject; JSON* v=FindKey(akey); if (v) return v; JSON b(GetPointer(this), JSUndef); b.m_key=akey; v=Add(b); return v; }
//------------------------------------------------------------------	operator[]
JSON* JSON::operator[](int i)
{
	if (m_type==JSUndef) m_type=JSArray;
	while (i>=Size()) { JSON b(GetPointer(this), JSUndef); if (CheckPointer(Add(b))==POINTER_INVALID) return NULL; }
	return GetPointer(m_e[i]);
}
//------------------------------------------------------------------	Set
void JSON::Set(const JSON& list[])
{
	if (m_type==JSUndef) m_type=JSArray;
	int n=ArrayResize(m_e, ArraySize(list), 100); for (int i=0; i<n; ++i) { m_e[i]=list[i]; m_e[i].m_parent=GetPointer(this); }
}

//------------------------------------------------------------------	Serialize
void JSON::Serialize(string& js, bool bkey/*=false*/, bool coma/*=false*/)
{
	if (m_type==JSUndef) return;
	if (coma) js+=",";
	if (bkey) js+=StringFormat("\"%s\":", m_key);
	int _n=Size();
	switch (m_type)
	{
	case JSNull: js+="null"; break;
	case JSBoolean: js+=(m_bv?"true":"false"); break;
	case JSNumber: js+=IntegerToString(m_iv); break;
	case JSFloat: js+=DoubleToString(m_dv, m_prec); break;
	case JSString: { string ss=Escape(m_sv); if (StringLen(ss)>0) js+=StringFormat("\"%s\"", ss); else js+="null"; } break;
	case JSArray: js+="["; for (int i=0; i<_n; i++) m_e[i].Serialize(js, false, i>0); js+="]"; break;
	case JSObject: js+="{"; for (int i=0; i<_n; i++) m_e[i].Serialize(js, true, i>0); js+="}"; break;
	}
}

//------------------------------------------------------------------	Deserialize
bool JSON::Deserialize(char& js[], int slen, int &i)
{
	string num="0123456789+-.eE";
	int i0=i;
	for (; i<slen; i++)
	{
		char c=js[i]; if (c==0) break;
		switch (c)
		{
		case '\t': case '\r': case '\n': case ' ': // пропускаем из имени пробелы
			i0=i+1; break;

		case '[': // начало массива. создаём объекты и забираем из js
		{
			i0=i+1;
			if (m_type!=JSUndef) { Print(m_key+" "+string(__LINE__)); return false; } // если значение уже имеет тип, то это ошибка
			m_type=JSArray; // задали тип значения
			i++; JSON val(GetPointer(this), JSUndef);
			while (val.Deserialize(js, slen, i))
			{
				if (val.m_type!=JSUndef) Add(val);
				if (val.m_type==JSNumber || val.m_type==JSFloat || val.m_type==JSArray) i++;
				val.Clear(); val.m_parent=GetPointer(this);
				if (js[i]==']') break;
				i++; if (i>=slen) { Print(m_key+" "+string(__LINE__)); return false; }
			}
			return js[i]==']' || js[i]==0;
		}
		break;
		case ']': if (!m_parent) return false; return m_parent.m_type==JSArray; // конец массива, текущее значение должны быть массивом

		case ':':
		{
			if (m_lkey=="") { Print(m_key+" "+string(__LINE__)); return false; }
			JSON val(GetPointer(this), JSUndef);
			JSON *oc=Add(val); // тип объекта пока не определён
			oc.m_key=m_lkey; m_lkey=""; // задали имя ключа
			i++; if (!oc.Deserialize(js, slen, i)) { Print(m_key+" "+string(__LINE__)); return false; }
			break;
		}
		case ',': // разделитель значений // тип значения уже должен быть определён
			i0=i+1;
			if (!m_parent && m_type!=JSObject) { Print(m_key+" "+string(__LINE__)); return false; }
			else if (m_parent)
			{
				if (m_parent.m_type!=JSArray && m_parent.m_type!=JSObject) { Print(m_key+" "+string(__LINE__)); return false; }
				if (m_parent.m_type==JSArray && m_type==JSUndef) return true;
			}
			break;

			// примитивы могут быть ТОЛЬКО в массиве / либо самостоятельно
		case '{': // начало объекта. создаем объект и забираем его из js
			i0=i+1;
			if (m_type!=JSUndef) { Print(m_key+" "+string(__LINE__)); return false; }// ошибка типа
			m_type=JSObject; // задали тип значения
			i++; if (!Deserialize(js, slen, i)) { Print(m_key+" "+string(__LINE__)); return false; } // вытягиваем его
			return js[i]=='}' || js[i]==0;
			break;
		case '}': return m_type==JSObject; // конец объекта, текущее значение должно быть объектом

		case 't': case 'T': // начало true
		case 'f': case 'F': // начало false
			if (m_type!=JSUndef) { Print(m_key+" "+string(__LINE__)); return false; } // ошибка типа
			m_type=JSBoolean; // задали тип значения
			if (i+3<slen) { if (StringCompare(GetStr(js, i, 4), "true", false)==0) { m_bv=true; i+=3; return true; } }
			if (i+4<slen) { if (StringCompare(GetStr(js, i, 5), "false", false)==0) { m_bv=false; i+=4; return true; } }
			Print(m_key+" "+string(__LINE__)); return false; // не тот тип или конец строки
			break;
		case 'n': case 'N': // начало null
			if (m_type!=JSUndef) { Print(m_key+" "+string(__LINE__)); return false; } // ошибка типа
			m_type=JSNull; // задали тип значения
			if (i+3<slen) if (StringCompare(GetStr(js, i, 4), "null", false)==0) { i+=3; return true; }
			Print(m_key+" "+string(__LINE__)); return false; // не NULL или конец строки
			break;

		case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': case '-': case '+': case '.': // начало числа
		{
			if (m_type!=JSUndef) { Print(m_key+" "+string(__LINE__)); return false; } // ошибка типа
			bool dbl=false;// задали тип значения
			int is=i; while (js[i]!=0 && i<slen) { i++; if (StringFind(num, GetStr(js, i, 1))<0) break; if (!dbl) dbl=(js[i]=='.' || js[i]=='e' || js[i]=='E'); }
			m_sv=GetStr(js, is, i-is);
			if (dbl) { m_type=JSFloat; m_dv=StringToDouble(m_sv); m_iv=(long)m_dv; m_bv=m_iv!=0; }
			else { m_type=JSNumber; m_iv=StringToInteger(m_sv); m_dv=(double)m_iv; m_bv=m_iv!=0; } // уточнии тип значения
			i--; return true; // отодвинулись на 1 символ назад и вышли
			break;
		}
		case '\"': // начало или конец строки
			if (m_type==JSObject) // если тип еще неопределён и ключ не задан
			{
				i++; int is=i; if (!ExtrStr(js, slen, i)) { Print(m_key+" "+string(__LINE__)); return false; } // это ключ, идём до конца строки
				m_lkey=GetStr(js, is, i-is);
			}
			else
			{
				if (m_type!=JSUndef) { Print(m_key+" "+string(__LINE__)); return false; } // ошибка типа
				m_type=JSString; // задали тип значения
				i++; int is=i;
				if (!ExtrStr(js, slen, i)) { Print(m_key+" "+string(__LINE__)); return false; }
				FromStr(JSString, GetStr(js, is, i-is));
				return true;
			}
			break;
		}
	}
	return true;
}

//------------------------------------------------------------------	ExtrStr
bool JSON::ExtrStr(char& js[], int slen, int &i)
{
	for (; js[i]!=0 && i<slen; i++)
	{
		char c=js[i];
		if (c=='\"') break; // конец строки
		if (c=='\\' && i+1<slen)
		{
			i++; c=js[i];
			switch (c)
			{
			case '/': case '\\': case '\"': case 'b': case 'f': case 'r': case 'n': case 't': break; // это разрешенные
			case 'u': // \uXXXX
			{
				i++;
				for (int j=0; j<4 && i<slen && js[i]!=0; j++, i++)
				{
					if (!((js[i]>='0' && js[i]<='9') || (js[i]>='A' && js[i]<='F') || (js[i]>='a' && js[i]<='f'))) { Print(m_key+" "+CharToString(js[i])+" "+string(__LINE__)); return false; } // не hex
				}
				i--;
				break;
			}
			default: break; /*{ return false; } // неразрешенный символ с экранированием */
			}
		}
	}
	return true;
}
//------------------------------------------------------------------	Escape
string JSON::Escape(string a)
{
	ushort as[], s[]; int n=StringToShortArray(a, as); if (ArrayResize(s, 2*n)!=2*n) return NULL;
	int j=0;
	for (int i=0; i<n; i++)
	{
		switch (as[i])
		{
		case '\\': s[j]='\\'; j++; s[j]='\\'; j++; break;
		case '"': s[j]='\\'; j++; s[j]='"'; j++; break;
		case '/': s[j]='\\'; j++; s[j]='/'; j++; break;
		case 8: s[j]='\\'; j++; s[j]='b'; j++; break;
		case 12: s[j]='\\'; j++; s[j]='f'; j++; break;
		case '\n': s[j]='\\'; j++; s[j]='n'; j++; break;
		case '\r': s[j]='\\'; j++; s[j]='r'; j++; break;
		case '\t': s[j]='\\'; j++; s[j]='t'; j++; break;
		default: s[j]=as[i]; j++; break;
		}
	}
	a=ShortArrayToString(s, 0, j);
	return a;
}
//------------------------------------------------------------------	Unescape
string JSON::Unescape(string a)
{
	ushort as[], s[]; int n=StringToShortArray(a, as); if (ArrayResize(s, n)!=n) return NULL;
	int j=0, i=0;
	while (i<n)
	{
		ushort c=as[i];
		if (c=='\\' && i<n-1)
		{
			switch (as[i+1])
			{
			case '\\': c='\\'; i++; break;
			case '"': c='"'; i++; break;
			case '/': c='/'; i++; break;
			case 'b': c=8; /*08='\b'*/; i++; break;
			case 'f': c=12;/*0c=\f*/ i++; break;
			case 'n': c='\n'; i++; break;
			case 'r': c='\r'; i++; break;
			case 't': c='\t'; i++; break;
			case 'u': // \uXXXX
			{
				i+=2; ushort k=0;
				for (int jj=0; jj<4 && i<n; jj++, i++)
				{
					c=as[i]; ushort h=0;
					if (c>='0' && c<='9') h=c-'0';
					else if (c>='A' && c<='F') h=c-'A'+10;
					else if (c>='a' && c<='f') h=c-'a'+10;
					else break; // не hex
					k+=h*(ushort)pow(16, (3-jj));
				}
				i--;
				c=k;
				break;
			}
			}
		}
		s[j]=c; j++; i++;
	}
	a=ShortArrayToString(s, 0, j);
	return a;
}
