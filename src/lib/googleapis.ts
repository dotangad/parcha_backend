export interface GoogleUserData {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
  hd: string;
}

export async function fetchGoogleUser(
  access_token: string,
): Promise<GoogleUserData> {
  const req = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`,
  );
  const user_data = await req.json();

  return user_data as GoogleUserData;
}
