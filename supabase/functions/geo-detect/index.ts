import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try Cloudflare header first (free, no API call needed)
    const cfCountry = req.headers.get('cf-ipcountry');
    if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
      // Look up country name from code
      const name = getCountryName(cfCountry);
      return new Response(JSON.stringify({
        country_code: cfCountry.toUpperCase(),
        country_name: name,
        source: 'cloudflare',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fallback: get IP from headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : null;

    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      return new Response(JSON.stringify({
        country_code: 'UN',
        country_name: 'Unknown',
        source: 'unknown',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Use ip-api.com (free, no key needed, 45 req/min)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country`);
    const geoData = await geoRes.json();

    if (geoData.status === 'success') {
      return new Response(JSON.stringify({
        country_code: geoData.countryCode.toUpperCase(),
        country_name: geoData.country,
        source: 'ip',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      country_code: 'UN',
      country_name: 'Unknown',
      source: 'unknown',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Geo detection error:', error);
    return new Response(JSON.stringify({
      country_code: 'UN',
      country_name: 'Unknown',
      source: 'unknown',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    AF:'Afghanistan',AL:'Albania',DZ:'Algeria',AO:'Angola',AR:'Argentina',AU:'Australia',
    AT:'Austria',BD:'Bangladesh',BE:'Belgium',BJ:'Benin',BR:'Brazil',BF:'Burkina Faso',
    BI:'Burundi',CM:'Cameroon',CA:'Canada',CF:'Central African Republic',TD:'Chad',
    CL:'Chile',CN:'China',CO:'Colombia',CD:'DR Congo',CG:'Congo',CI:"Côte d'Ivoire",
    HR:'Croatia',CU:'Cuba',CZ:'Czechia',DK:'Denmark',EC:'Ecuador',EG:'Egypt',
    ET:'Ethiopia',FI:'Finland',FR:'France',GA:'Gabon',GM:'Gambia',DE:'Germany',
    GH:'Ghana',GR:'Greece',GT:'Guatemala',GN:'Guinea',HT:'Haiti',HN:'Honduras',
    HK:'Hong Kong',HU:'Hungary',IS:'Iceland',IN:'India',ID:'Indonesia',IR:'Iran',
    IQ:'Iraq',IE:'Ireland',IL:'Israel',IT:'Italy',JM:'Jamaica',JP:'Japan',JO:'Jordan',
    KE:'Kenya',KR:'South Korea',KW:'Kuwait',LB:'Lebanon',LR:'Liberia',LY:'Libya',
    MG:'Madagascar',MW:'Malawi',MY:'Malaysia',ML:'Mali',MX:'Mexico',MA:'Morocco',
    MZ:'Mozambique',MM:'Myanmar',NA:'Namibia',NP:'Nepal',NL:'Netherlands',NZ:'New Zealand',
    NE:'Niger',NG:'Nigeria',NO:'Norway',PK:'Pakistan',PA:'Panama',PY:'Paraguay',
    PE:'Peru',PH:'Philippines',PL:'Poland',PT:'Portugal',QA:'Qatar',RO:'Romania',
    RU:'Russia',RW:'Rwanda',SA:'Saudi Arabia',SN:'Senegal',RS:'Serbia',SL:'Sierra Leone',
    SG:'Singapore',SK:'Slovakia',SI:'Slovenia',SO:'Somalia',ZA:'South Africa',ES:'Spain',
    LK:'Sri Lanka',SD:'Sudan',SE:'Sweden',CH:'Switzerland',TW:'Taiwan',TZ:'Tanzania',
    TH:'Thailand',TG:'Togo',TT:'Trinidad and Tobago',TN:'Tunisia',TR:'Turkey',
    UG:'Uganda',UA:'Ukraine',AE:'United Arab Emirates',GB:'United Kingdom',US:'United States',
    UY:'Uruguay',VE:'Venezuela',VN:'Vietnam',YE:'Yemen',ZM:'Zambia',ZW:'Zimbabwe',
  };
  return countries[code.toUpperCase()] || code;
}
