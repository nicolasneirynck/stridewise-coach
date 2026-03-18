import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UserService } from './users.service';
import { PublicUserResponseDTO, RegisterUserRequestDTO } from './users.dto';
import { LoginResponseDTO } from '../session/sessions.dto';
import { AuthService } from '../auth/auth.service';
import { CheckUserAccessGuard } from '../auth/guards/userAcces.guard';
import type { Session } from '../../common/types/auth';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { ParseUserIdPipe } from '../auth/pipes/parseUserIdPipe.pipe';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get(':id')
  @UseGuards(CheckUserAccessGuard)
  getUserById(
    @Param('id', ParseUserIdPipe) id: 'me' | number,
    @CurrentUser() user: Session,
  ): Promise<PublicUserResponseDTO> {
    const userId = id === 'me' ? user.id : id;
    return this.userService.getById(userId);
  }

  // @Put(':id')
  // @UseGuards(CheckUserAccessGuard)
  // async updateUserById(
  //   @Param('id', ParseUserIdPipe) id: 'me' | number,
  //   @CurrentUser() user: Session,
  //   @Body() dto: UpdateUserRequestDTO,
  // ): Promise<PublicUserResponseDTO> {
  //   return await this.userService.updateById(
  //     id === 'me' ? user.id : id, // 👈
  //     dto,
  //   );
  // }

  @Post()
  async registerUser(
    @Body() registerDto: RegisterUserRequestDTO,
  ): Promise<LoginResponseDTO> {
    const token = await this.authService.register(registerDto);
    return { token };
  }

  // @Delete(':id')
  // @UseGuards(CheckUserAccessGuard)
  // async deleteUserById(
  //   @Param('id', ParseUserIdPipe) id: 'me' | number,
  //   @CurrentUser() user: Session,
  // ): Promise<void> {
  //   return await this.userService.deleteById(id === 'me' ? user.id : id);
  // }
}
