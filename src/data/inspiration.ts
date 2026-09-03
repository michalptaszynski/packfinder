import { asset } from '../lib/asset'

/** Photography from Packhelp's packaging-ideas gallery, kept in public/. */
export const INSPIRATION_PHOTOS = [
  'inspiration-kuyichi',
  'packhelp-27-08-2021-12715',
  'inspiration-psi-bufet',
  'packhelp-28821-b-2',
  'inspiration-hemp-juice',
  'packhelp-packshot-10270',
  'inspiration-kaya',
  'packhelp-02-03-11-2022-24734-2',
  'inspiration-fluus',
  'packhelp-26-28-05-2021-7449',
  'inspiration-oase',
  'christmas-happy-socks',
  'inspiration-xlash',
  'packhelp-09-2021-0306',
  'packhelp-28445-2',
  'packhelp-26-28-05-2021-7152',
].map((name) => asset(`/photos/inspiration/${name}.jpg`))
