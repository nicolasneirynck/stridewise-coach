import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UserService } from './users.service';
import { PublicUserResponseDTO, RegisterUserRequestDTO } from './users.dto';
import { AuthService } from '../auth/auth.service';
import { AuthResponseDTO } from '../auth/auth-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckUserAccessGuard } from '../auth/guards/user-access.guard';
import { ParseUserIdPipe } from '../auth/pipes/parse-user-id.pipe';
import type { Session } from '../../common/types/auth';

// Contains public registration plus authenticated user resource routes.
@Controller('users')
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // public user registration entrypoint
  @Public()
  @Post()
  async register(
    @Body() dto: RegisterUserRequestDTO,
  ): Promise<AuthResponseDTO> {
    return { token: await this.authService.register(dto) };
  }

  // authenticated user routes
  @Get(':id')
  @UseGuards(CheckUserAccessGuard)
  async getUserById(
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

  // @Delete(':id')
  // @UseGuards(CheckUserAccessGuard)
  // async deleteUserById(
  //   @Param('id', ParseUserIdPipe) id: 'me' | number,
  //   @CurrentUser() user: Session,
  // ): Promise<void> {
  //   return await this.userService.deleteById(id === 'me' ? user.id : id);
  // }
}
