import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  @MinLength(4, { message: 'Password minimal 4 karakter' })
  password: string;
}
